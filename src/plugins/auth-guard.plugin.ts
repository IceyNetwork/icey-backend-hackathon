import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import { AUTH } from "../config";
import { FastifyReply, FastifyRequest } from "fastify";

export default fp(async (app) => {
  await app.register(cookie, {
    hook: "onRequest",
  });

  await app.register(jwt, {
    secret: AUTH.JWT_SECRET,
    cookie: {
      cookieName: "accessToken",
      signed: false,
    },
  });

  app.decorate("auth", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify({ onlyCookie: true });
    } catch {
      reply.clearCookie("accessToken", { path: "/" });
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });
});
