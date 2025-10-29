import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { makeNonce, loginMessage } from "../services/utils";
import { UsersCollection } from "../database/users";
import { verifySolanaSignature } from "../services/solana";
import { AUTH } from "../config";

const authRoutes: FastifyPluginAsync = async (app) => {
  const users = new UsersCollection(app.mongoClient);

  app.post<{ Body: { address: string } }>("/auth/nonce", async (req, reply) => {
    const address = req.body.address?.trim();
    if (!address) return reply.code(400).send({ error: "Address required" });
    const nonce = makeNonce();
    await users.upsertWithNonce(address, nonce);
    const message = loginMessage(address, nonce);
    return { nonce, message };
  });

  app.post<{ Body: { address: string; signature: string } }>(
    "/auth/login",
    async (req, reply) => {
      const { address, signature } = req.body;
      const user = await users.findByAddress(address);
      if (!user)
        return reply.code(400).send({ error: "Call /auth/nonce first" });

      const message = loginMessage(address, user.nonce);
      const ok = verifySolanaSignature(address, message, signature);
      if (!ok) return reply.code(401).send({ error: "Invalid signature" });

      const nextNonce = makeNonce();
      await users.rotateNonce(address, nextNonce);

      const token = app.jwt.sign(
        { sub: address },
        { expiresIn: AUTH.JWT_EXPIRES_IN }
      );
      const isProd = process.env.NODE_ENV === "production";

      reply.setCookie("accessToken", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return { ok: true };
    }
  );
  app.post("/auth/logout", async (_req, reply) => {
    reply.clearCookie("accessToken", { path: "/" });
    return { ok: true };
  });
};

export default fp(authRoutes);
