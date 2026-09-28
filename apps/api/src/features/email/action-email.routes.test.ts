import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createActionEmailRouter } from "./action-email.routes";

const USER = "11111111-1111-4111-8111-111111111111";
vi.mock("../../shared/middleware/auth", () => ({
  authMiddleware: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (req.header("authorization") !== "Bearer test") return res.status(401).send();
    (req as express.Request & { userId: string }).userId = USER;
    next();
  },
  getUserId: (req: express.Request & { userId: string }) => req.userId,
}));

describe("action email preferences", () => {
  let server: ReturnType<express.Application["listen"]> | undefined;
  afterEach(async () => {
    await new Promise<void>(
      (resolve, reject) =>
        server?.close((error) => (error ? reject(error) : resolve())) ?? resolve(),
    );
  });

  async function url() {
    let enabled = false;
    const repo = {
      getPreference: vi.fn(() => Promise.resolve(enabled)),
      setPreference: vi.fn((_id: string, value: boolean) => {
        enabled = value;
        return Promise.resolve();
      }),
      unsubscribe: vi.fn((token: string) => {
        enabled = false;
        return Promise.resolve(token === "a".repeat(64));
      }),
    };
    const app = express();
    app.disable("x-powered-by");
    app.use(express.json());
    app.use("/email-preferences", createActionEmailRouter(repo));
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server!.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No port");
    return { base: `http://127.0.0.1:${address.port}/email-preferences`, repo };
  }

  it("requires a session and accepts only an explicit boolean preference", async () => {
    const { base, repo } = await url();
    expect((await fetch(base)).status).toBe(401);
    const response = await fetch(base, {
      method: "PUT",
      headers: { authorization: "Bearer test", "content-type": "application/json" },
      body: JSON.stringify({ actionEmails: true }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ actionEmails: true });
    expect(repo.setPreference).toHaveBeenCalledWith(USER, true);
    const invalid = await fetch(base, {
      method: "PUT",
      headers: { authorization: "Bearer test", "content-type": "application/json" },
      body: JSON.stringify({ actionEmails: "yes" }),
    });
    expect(invalid.status).toBe(400);
  });

  it("shows a confirmation page before changing the preference without login", async () => {
    const { base, repo } = await url();
    const link = `${base}/unsubscribe/${"a".repeat(64)}`;
    const preview = await fetch(link);
    expect(preview.status).toBe(200);
    expect(repo.unsubscribe).not.toHaveBeenCalled();
    const submit = await fetch(link, { method: "POST" });
    expect(submit.status).toBe(200);
    expect(repo.unsubscribe).toHaveBeenCalledOnce();
  });
});
