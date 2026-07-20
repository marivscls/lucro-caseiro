import { describe, expect, it } from "vitest";

import { fitLabelPreviewScale } from "./label-preview";

describe("fitLabelPreviewScale", () => {
  it("reduz a previa para caber em viewports estreitas", () => {
    expect(fitLabelPreviewScale(1.2, 320)).toBe(1);
  });

  it("preserva a escala pedida quando existe largura suficiente", () => {
    expect(fitLabelPreviewScale(1.1, 390)).toBe(1.1);
    expect(fitLabelPreviewScale(1.2, 1200)).toBe(1.2);
  });
});
