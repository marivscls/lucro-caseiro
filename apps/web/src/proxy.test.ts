import { describe, expect, it } from "vitest";

import { shouldServePublicSiteAtRoot } from "./proxy";

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
