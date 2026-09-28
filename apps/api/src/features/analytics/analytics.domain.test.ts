import { describe, expect, it } from "vitest";

import {
  isFreshSignup,
  SIGNUP_IDENTIFICATION_WINDOW_MS,
  withoutServerOwnedEvents,
} from "./analytics.domain";

describe("isFreshSignup", () => {
  const identifiedAt = new Date("2026-09-20T12:00:00.000Z");

  it("aceita conta criada dentro da janela na primeira identificação", () => {
    // Arrange
    const userCreatedAt = new Date(
      identifiedAt.getTime() - SIGNUP_IDENTIFICATION_WINDOW_MS,
    );

    // Act
    const result = isFreshSignup({ firstUserLink: true, userCreatedAt }, identifiedAt);

    // Assert
    expect(result).toBe(true);
  });

  it("recusa conta fora da janela, já vinculada ou sem data de criação", () => {
    // Arrange
    const old = new Date(identifiedAt.getTime() - SIGNUP_IDENTIFICATION_WINDOW_MS - 1);

    // Act / Assert
    expect(isFreshSignup({ firstUserLink: true, userCreatedAt: old }, identifiedAt)).toBe(
      false,
    );
    expect(
      isFreshSignup({ firstUserLink: false, userCreatedAt: identifiedAt }, identifiedAt),
    ).toBe(false);
    expect(
      isFreshSignup({ firstUserLink: true, userCreatedAt: null }, identifiedAt),
    ).toBe(false);
  });
});

describe("withoutServerOwnedEvents", () => {
  it("remove apenas signup_completed", () => {
    // Arrange
    const events = [
      { type: "action", name: "signup_completed" },
      { type: "action", name: "pricing_started" },
      { type: "screen_view", name: "register", durationMs: 1_000 },
    ] as const;

    // Act
    const result = withoutServerOwnedEvents([...events]);

    // Assert
    expect(result.map((event) => event.name)).toEqual(["pricing_started", "register"]);
  });
});
