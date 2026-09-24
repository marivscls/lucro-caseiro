import { describe, expect, it } from "vitest";

import { prefersBrowserApp, startDestinations } from "./hero-actions";
import { playStoreUrl, pwaUrl } from "./site-constants";

describe("prefersBrowserApp", () => {
  it("mostra a Play Store primeiro só no Android", () => {
    expect(prefersBrowserApp("Mozilla/5.0 (Linux; Android 14)")).toBe(false);
    expect(prefersBrowserApp("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe(true);
    expect(prefersBrowserApp("Mozilla/5.0 (Windows NT 10.0)")).toBe(true);
  });
});

describe("links com UTM", () => {
  it("leva a posição do botão para a Play Store", () => {
    const referrer = new URL(playStoreUrl("play_store_hero")).searchParams.get(
      "referrer",
    );
    expect(new URLSearchParams(referrer ?? "").get("utm_content")).toBe(
      "play_store_hero",
    );
  });

  it("leva a posição do botão para o app no navegador", () => {
    const url = new URL(pwaUrl("pwa_header"));
    expect(url.searchParams.get("utm_source")).toBe("site_publico");
    expect(url.searchParams.get("utm_content")).toBe("pwa_header");
  });
});

describe("botão Começar grátis", () => {
  it("leva o Android para a Play Store e o resto para o navegador", () => {
    const android = startDestinations("hero", false);
    expect(android.primary.analytics).toBe("play_store_hero");
    expect(android.alternative.analytics).toBe("pwa_hero");

    const desktop = startDestinations("hero", true);
    expect(desktop.primary.analytics).toBe("pwa_hero");
    expect(desktop.primary.href).toContain("utm_content=pwa_hero");
  });
});
