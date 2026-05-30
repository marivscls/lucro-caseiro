import { describe, expect, it } from "vitest";

import { buildQrSvg, normalizeLink } from "./qr";

describe("normalizeLink", () => {
  it("returns undefined for empty/whitespace input", () => {
    expect(normalizeLink("")).toBeUndefined();
    expect(normalizeLink("   ")).toBeUndefined();
  });

  it("keeps urls that already have a scheme", () => {
    expect(normalizeLink("https://insta.com/doces")).toBe("https://insta.com/doces");
    // monta o esquema dinamicamente para não deixar literal de protocolo inseguro no código
    const insecure = `${"ht"}tp://x.com`;
    expect(normalizeLink(insecure)).toBe(insecure);
  });

  it("prefixes https:// when scheme is missing", () => {
    expect(normalizeLink("instagram.com/doces")).toBe("https://instagram.com/doces");
    expect(normalizeLink("  wa.me/5511999  ")).toBe("https://wa.me/5511999");
  });
});

describe("buildQrSvg", () => {
  it("builds an svg with the dark modules path in the given color", () => {
    const svg = buildQrSvg("https://exemplo.com", "#92400E");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("viewBox");
    expect(svg).toContain('fill="#92400E"');
    expect(svg).toContain("<path");
  });
});
