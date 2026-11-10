import { CreateProductDto, MAX_PRODUCT_EXTRA_PHOTOS } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

const base = { name: "Bolo de pote", category: "Doces", salePrice: 12 };
const photos = (count: number) =>
  Array.from({ length: count }, (_, index) => `https://cdn.x/foto-${index}.jpg`);

describe("product gallery limit", () => {
  it("accepts up to 5 photos per product (main + 4 extras)", () => {
    expect(MAX_PRODUCT_EXTRA_PHOTOS).toBe(4);
    const result = CreateProductDto.safeParse({ ...base, extraPhotos: photos(4) });
    expect(result.success).toBe(true);
  });

  it("rejects a fifth extra photo", () => {
    const result = CreateProductDto.safeParse({ ...base, extraPhotos: photos(5) });
    expect(result.success).toBe(false);
  });
});
