import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { UsersCollection } from "../database/users";
import { submitSignedTxBase64, withdrawSplToUser } from "../services/solana";
import { BN } from "@coral-xyz/anchor";

const walletRoutes: FastifyPluginAsync = async (app) => {
  const users = new UsersCollection(app.mongoClient);

  app.get(
    "/wallet/balance",
    { preHandler: [app.auth] },
    async (req: any, reply) => {
      const me = req.user.sub as string;
      const u = await users.findByAddress(me);
      if (!u) return reply.code(404).send({ error: "User not found" });
      return { address: me, amount: u.amount ?? 0 };
    }
  );

  app.get<{ Querystring: { address: string } }>(
    "/wallet/check-user",
    { preHandler: [app.auth] },
    async (req, reply) => {
      const { address } = req.query;

      if (!address || typeof address !== "string" || address.trim() === "") {
        return reply
          .code(400)
          .send({ error: "Address query parameter is required" });
      }

      try {
        const user = await users.findByAddress(address.trim());
        return { exists: !!user };
      } catch (e: any) {
        console.error("Error checking user:", e.message);
        return reply.code(500).send({ error: "Error checking user" });
      }
    }
  );

  app.post<{ Body: { to: string; amount: string | number; memo?: string } }>(
    "/wallet/transfer",
    { preHandler: [app.auth] },
    async (req: any, reply) => {
      const from = req.user.sub as string;
      const to = (req.body.to || "").trim();
      const bn = new BN(String(req.body.amount || "0"));
      if (!to) return reply.code(400).send({ error: "To required" });
      if (to === from)
        return reply.code(400).send({ error: "Cannot transfer to self" });
      if (bn.lte(new BN(0)))
        return reply.code(400).send({ error: "Invalid amount" });
      try {
        await users.transfer(from, to, Number(bn.toString()));
        return { ok: true };
      } catch (e: any) {
        return reply.code(400).send({ error: e?.message || "Transfer failed" });
      }
    }
  );

  app.post<{ Body: { txBase64: string; expectedAmount: string | number } }>(
    "/wallet/deposit",
    { preHandler: [app.auth] },
    async (req: any, reply) => {
      const me = req.user.sub as string;
      const { txBase64 } = req.body || {};
      const expected = new BN(String(req.body.expectedAmount || "0"));
      if (!txBase64)
        return reply.code(400).send({ error: "Variable txBase64 required" });
      if (expected.lte(new BN(0)))
        return reply.code(400).send({ error: "Invalid expectedAmount" });

      let signature: string;
      try {
        signature = await submitSignedTxBase64(txBase64);
      } catch (e: any) {
        return reply
          .code(400)
          .send({ error: `Chain submit failed: ${e?.message}` });
      }

      await users.incBalance(me, Number(expected.toString()));

      return { ok: true, signature, credited: expected.toString() };
    }
  );

  app.post<{ Body: { amount: string } }>(
    "/wallet/withdraw",
    { preHandler: [app.auth] },
    async (req: any, reply) => {
      const me = req.user.sub as string;
      const amt = new BN(req.body.amount || "0");
      if (amt.lte(new BN(0)))
        return reply.code(400).send({ error: "Invalid amount" });

      const u = await users.findByAddress(me);
      if (!u) return reply.code(404).send({ error: "User not found" });
      if (new BN(String(u.amount ?? 0)).lt(amt))
        return reply.code(400).send({ error: "Insufficient funds" });

      await users.incBalance(me, -Number(amt.toString()));
      try {
        const signature = await withdrawSplToUser(me, amt);
        return { ok: true, signature };
      } catch (e: any) {
        await users.incBalance(me, Number(amt.toString())).catch(() => {});
        return reply
          .code(500)
          .send({ error: `Withdraw failed: ${e?.message}` });
      }
    }
  );
};

export default fp(walletRoutes);
