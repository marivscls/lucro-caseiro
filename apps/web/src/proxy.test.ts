import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy, resolveRequestHostname, shouldServePublicSiteAtRoot } from "./proxy";

describe("public site canonical routing", () => {
  it("does not leak the upstream port into the public redirect", () => {
    const response = proxy(
      new NextRequest("http://localhost:3006/landing", {
        headers: { "x-forwarded-host": "lucrocaseiro.com.br" },
      }),
    );
    expect(response.headers.get("location")).toBe("https://lucrocaseiro.com.br/");
  });
  it("redirects www directly to the canonical page, preserving attribution", () => {
    const response = proxy(
      new NextRequest("https://www.lucrocaseiro.com.br/landing?utm_source=test"),
    );
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://lucrocaseiro.com.br/?utm_source=test",
    );
  });

  it("redirects the legacy homepage without redirecting guides", () => {
    expect(
      proxy(new NextRequest("https://lucrocaseiro.com.br/landing")).headers.get(
        "location",
      ),
    ).toBe("https://lucrocaseiro.com.br/");
    expect(
      proxy(
        new NextRequest(
          "https://lucrocaseiro.com.br/landing/guias/como-calcular-preco-de-venda",
        ),
      ).status,
    ).toBe(200);
  });

  it("keeps attribution when rewriting the root and retains security headers", () => {
    const response = proxy(
      new NextRequest("https://lucrocaseiro.com.br/?utm_source=test"),
    );
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://lucrocaseiro.com.br/landing?utm_source=test",
    );
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
  });

  it("leaves the marketing central root available on its own domain", () => {
    const response = proxy(new NextRequest("https://central.lucrocaseiro.com.br/"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});

describe("resolveRequestHostname", () => {
  it("prefers the original host forwarded by Railway", () => {
    expect(
      resolveRequestHostname(
        "lucrocaseiro.com.br",
        "web.railway.internal:8080",
        "localhost",
      ),
    ).toBe("lucrocaseiro.com.br");
  });

  it("falls back to Host and removes its port", () => {
    expect(
      resolveRequestHostname(null, "central.lucrocaseiro.com.br:443", "localhost"),
    ).toBe("central.lucrocaseiro.com.br");
  });
});

describe("shouldServePublicSiteAtRoot", () => {
  it.each(["lucrocaseiro.com.br", "www.lucrocaseiro.com.br"])(
    "serves the public site at the root of %s",
    (hostname) => {
      expect(shouldServePublicSiteAtRoot(hostname, "/")).toBe(true);
    },
  );

  it.each(["central.lucrocaseiro.com.br", "app.lucrocaseiro.com.br", "localhost"])(
    "keeps the Central away from the public domain for %s",
    (hostname) => {
      expect(shouldServePublicSiteAtRoot(hostname, "/")).toBe(false);
    },
  );

  it("does not rewrite public site subpaths", () => {
    expect(shouldServePublicSiteAtRoot("lucrocaseiro.com.br", "/landing")).toBe(false);
  });
});
