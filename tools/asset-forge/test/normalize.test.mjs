import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeName, slugify } from "../src/normalize.mjs";

test("remove acentos, maiúsculas e pontuação", () => {
  assert.equal(normalizeName("Açúcar Refinado!"), "acucar refinado");
});

test("remove números, unidades e parênteses", () => {
  assert.equal(normalizeName("Leite Condensado Moça 395g"), "leite condensado moca");
  assert.equal(normalizeName("Farinha de trigo (1 kg)"), "farinha trigo");
});

test("remove stopwords de ligação", () => {
  assert.equal(normalizeName("Caixa para bolo"), "caixa bolo");
});

test("slugify gera kebab-case", () => {
  assert.equal(slugify("Chocolate em pó"), "chocolate-em-po");
});

test("entrada vazia/inválida vira string vazia", () => {
  assert.equal(normalizeName(""), "");
  assert.equal(normalizeName(null), "");
  assert.equal(normalizeName(undefined), "");
});
