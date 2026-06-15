import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveEntryOrName, resolveIngredient } from "../src/catalog.mjs";

function slugOf(name) {
  return resolveIngredient(name)?.slug ?? null;
}

test("casa nomes diretos do catálogo", () => {
  assert.equal(slugOf("Açúcar refinado"), "acucar");
  assert.equal(slugOf("Chocolate em pó"), "chocolate-em-po");
  assert.equal(slugOf("Caixa para bolo"), "caixa");
});

test("casa por alias / palavra-chave", () => {
  assert.equal(slugOf("Farinha de trigo"), "farinha-de-trigo");
  assert.equal(slugOf("Trigo"), "farinha-de-trigo");
  assert.equal(slugOf("Leite integral"), "leite");
});

test("prefere o alias mais específico (leite condensado > leite)", () => {
  assert.equal(slugOf("Leite Condensado Moça 395g"), "leite-condensado");
});

test("retorna null para nomes sem correspondência", () => {
  assert.equal(slugOf("Foguete espacial"), null);
  assert.equal(slugOf(""), null);
});

test("toda entrada do catálogo resolve para si mesma pelo label", async () => {
  const { CATALOG } = await import("../src/catalog.mjs");
  for (const entry of CATALOG) {
    assert.ok(resolveIngredient(entry.label), `sem match para ${entry.label}`);
  }
});

test("resolveEntryOrName usa o catálogo ou deriva do nome livre", () => {
  assert.equal(resolveEntryOrName("Açúcar refinado").slug, "acucar");

  const lasanha = resolveEntryOrName("Lasanha");
  assert.equal(lasanha.slug, "lasanha");
  assert.equal(lasanha.label, "Lasanha");

  const torta = resolveEntryOrName("Coxinha de frango");
  assert.equal(torta.slug, "coxinha-frango");
});
