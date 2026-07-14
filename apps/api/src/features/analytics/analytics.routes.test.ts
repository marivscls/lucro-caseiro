import { describe, expect, it } from "vitest";

import { isAdminUser } from "./analytics.admin";

describe("isAdminUser", () => {
  const admins = new Set(["user-admin"]);

  it("autoriza somente IDs configurados", () => {
    expect(isAdminUser("user-admin", admins)).toBe(true);
    expect(isAdminUser("user-common", admins)).toBe(false);
  });

  it("nega todos quando a lista está vazia", () => {
    expect(isAdminUser("user-admin", new Set())).toBe(false);
  });
});
