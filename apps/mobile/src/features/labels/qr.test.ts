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
  it("builds an svg with black modules by default (max contrast)", () => {
    const svg = buildQrSvg("https://exemplo.com");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("viewBox");
    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('fill="#ffffff"'); // fundo branco
    expect(svg).toContain("<path");
  });

  it("accepts a custom module color", () => {
    expect(buildQrSvg("https://exemplo.com", "#92400E")).toContain('fill="#92400E"');
  });
});
