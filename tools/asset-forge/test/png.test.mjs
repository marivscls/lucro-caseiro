import { test } from "node:test";
import assert from "node:assert/strict";

import { hexToRgb, solidCirclePng } from "../src/png.mjs";

test("hexToRgb converte e tem fallback", () => {
  assert.deepEqual(hexToRgb("#C4707E"), [196, 112, 126]);
  assert.deepEqual(hexToRgb("C4707E"), [196, 112, 126]);
  assert.deepEqual(hexToRgb("invalido"), [196, 112, 126]);
});

test("solidCirclePng gera um PNG válido com as dimensões certas", () => {
  const png = solidCirclePng(64, [10, 20, 30]);
  assert.ok(Buffer.isBuffer(png));
  // assinatura PNG
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  // largura/altura no IHDR (offsets 16 e 20)
  assert.equal(png.readUInt32BE(16), 64);
  assert.equal(png.readUInt32BE(20), 64);
  // termina com o chunk IEND
  assert.equal(png.subarray(-8, -4).toString("ascii"), "IEND");
});
