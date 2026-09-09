import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createWebPushRouter } from "./web-push.routes";
import type { WebPushRepoPg } from "./web-push.repo.pg";

vi.mock("../../shared/middleware/auth", () => ({
  authMiddleware: (_req: unknown, res: express.Response) =>
    res.status(401).json({ error: "UNAUTHORIZED" }),
  getUserId: () => "unused",
}));

describe("public Web Push configuration", () => {
  let server: ReturnType<express.Application["listen"]> | undefined;
  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      if (!server) return resolve();
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });
  async function url(configured: boolean) {
    const app = express();
    app.disable("x-powered-by");
    app.use(
      "/web",
      createWebPushRouter(
        {} as WebPushRepoPg,
        "public-key",
        configured ? () => Promise.resolve("sent") : null,
      ),
    );
    const listeningServer = app.listen(0, "127.0.0.1");
    server = listeningServer;
    await new Promise<void>((resolve) => listeningServer.once("listening", resolve));
    const address = listeningServer.address();
    if (!address || typeof address === "string") throw new Error("Missing server port");
    return `http://127.0.0.1:${address.port}/web`;
  }
  it("exposes only the public key without requiring an active session", async () => {
    const response = await fetch(`${await url(true)}/config`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ publicKey: "public-key" });
  });
  it("reports missing configuration and still protects subscription writes", async () => {
    const base = await url(false);
    expect(await (await fetch(`${base}/config`)).json()).toEqual({ publicKey: null });
    expect((await fetch(`${base}/subscription`, { method: "PUT" })).status).toBe(401);
  });
});
