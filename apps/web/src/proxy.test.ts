import { describe, expect, it } from "vitest";

import { resolveRequestHostname, shouldServePublicSiteAtRoot } from "./proxy";

describe("resolveRequestHostname", () => {
  it("prefers the original host forwarded by Railway", () => {
    expect(
      resolveRequestHostname("lucrocaseiro.com.br", "web.railway.internal:8080", "localhost"),
    ).toBe("lucrocaseiro.com.br");
  });

  it("falls back to Host and removes its port", () => {
    expect(resolveRequestHostname(null, "central.lucrocaseiro.com.br:443", "localhost")).toBe(
      "central.lucrocaseiro.com.br",
    );
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
