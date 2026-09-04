import { describe, expect, it } from "vitest";
import { spacing } from "@lucro-caseiro/ui";

import {
  floatingTabBarReserve,
  mobileTabBarSafeInset,
  screenCreateBarBottomPadding,
} from "./floating-tab-bar";

describe("screenCreateBarBottomPadding", () => {
  it("usa o espaçamento médio no desktop", () => {
    expect(
      screenCreateBarBottomPadding({
        isDesktop: true,
        isTabScreen: true,
        bottomInset: 48,
      }),
    ).toBe(spacing.md);
  });

  it("não soma o inset em telas empilhadas (o Stack já reserva a tab bar)", () => {
    expect(
      screenCreateBarBottomPadding({
        isDesktop: false,
        isTabScreen: false,
        bottomInset: 48,
      }),
    ).toBe(spacing.lg);
  });

  it("reserva a tab bar nas rotas de tab e deixa um vão acima da navbar", () => {
    expect(
      screenCreateBarBottomPadding({
        isDesktop: false,
        isTabScreen: true,
        bottomInset: 48,
      }),
    ).toBe(floatingTabBarReserve(mobileTabBarSafeInset(48)) + spacing.lg);
  });
});
