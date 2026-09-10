import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { publicSiteRedirect } from "./public-site-redirect";

describe("public site HTTPS redirect", () => {
  let server: ReturnType<ReturnType<typeof express>["listen"]>;
  let base: string;

  beforeAll(async () => {
    const app = express();
    app.disable("x-powered-by");
    app.set("trust proxy", 1);
    app.use(publicSiteRedirect);
    app.use((_req, res) => res.json({ api: true }));
    await new Promise<void>((resolve, reject) => {
      server = app.listen(0, "127.0.0.1", (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing port");
    base = `http://127.0.0.1:${address.port}`;
  });

  afterAll(() => new Promise<void>((resolve) => server?.close(() => resolve())));

  it.each([
    ["/", "https://lucrocaseiro.com.br/"],
    ["/landing?utm_source=test", "https://lucrocaseiro.com.br/?utm_source=test"],
    [
      "/landing/calculadora?utm_source=test",
      "https://lucrocaseiro.com.br/landing/calculadora?utm_source=test",
    ],
    ["//other.example/path", "https://lucrocaseiro.com.br//other.example/path"],
  ])("redirects %s without changing the destination host", async (path, destination) => {
    const response = await fetch(base + path, {
      headers: { "x-forwarded-host": "WWW.LUCROCASEIRO.COM.BR:443" },
      redirect: "manual",
    });
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(destination);
  });

  it.each([
    "catalogo.lucrocaseiro.com.br",
    "www.lucrocaseiro.com.br.evil.example",
    "localhost",
  ])("preserves API routes on %s", async (host) => {
    const response = await fetch(`${base}/api/v1/health`, {
      headers: { "x-forwarded-host": host },
      redirect: "manual",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ api: true });
  });

  it("does not execute API writes through the public alias", async () => {
    const response = await fetch(`${base}/api/v1/orders`, {
      method: "POST",
      headers: { "x-forwarded-host": "www.lucrocaseiro.com.br" },
      redirect: "manual",
    });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
    expect(response.headers.get("location")).toBeNull();
  });
});
