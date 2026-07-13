import { describe, expect, it } from "vitest";

import { buildQrSvg } from "./qr";

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
