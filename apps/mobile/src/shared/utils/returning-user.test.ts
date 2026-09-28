import { describe, expect, it } from "vitest";

import { hasSignedInOnDevice, markSignedInOnDevice } from "./returning-user";

describe("returning user", () => {
  it("começa sem ninguém ter entrado e lembra depois do primeiro login", async () => {
    expect(await hasSignedInOnDevice()).toBe(false);
    markSignedInOnDevice();
    await Promise.resolve();
    expect(await hasSignedInOnDevice()).toBe(true);
  });
});
