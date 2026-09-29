import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { loadGuideArticles, paragraphs, parseGuideArticle } from "./guide-articles";

const article = (overrides: Record<string, unknown> = {}) => ({
  slug: "custo-da-embalagem",
  title: "Como calcular o custo da embalagem",
  description:
    "Veja como somar caixa, etiqueta e sacola no preço de venda sem esquecer nenhum custo da embalagem.",
  keyword: "custo da embalagem",
  publishedAt: "2026-09-29",
  sections: [
    { heading: "Liste tudo", body: "Caixa, etiqueta, fita e sacola entram na conta.\n\nSome cada item." },
    { heading: "Divida por unidade", body: "Divida o pacote pelo número de unidades que ele rende." },
  ],
  faq: [{ question: "A sacola entra?", answer: "Entra, se vai junto com o produto." }],
  ...overrides,
});

let dir = "";
const makeDir = (files: Record<string, unknown>) => {
  dir = mkdtempSync(path.join(tmpdir(), "guias-"));
  for (const [name, content] of Object.entries(files))
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- pasta temporária do teste
    writeFileSync(
      path.join(dir, name),
      typeof content === "string" ? content : JSON.stringify(content),
    );
  return dir;
};
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = "";
});

describe("guias gerados pela Ametista", () => {
  it("aceita um guia completo cujo endereço bate com o nome do arquivo", () => {
    // Arrange
    const raw = article();
    // Act
    const parsed = parseGuideArticle(raw, "custo-da-embalagem");
    // Assert
    expect(parsed?.title).toBe("Como calcular o custo da embalagem");
    expect(parsed?.sections).toHaveLength(2);
    expect(parsed?.faq).toHaveLength(1);
  });

  it("recusa endereço diferente do arquivo, endereço inválido, data inválida ou poucas seções", () => {
    expect(parseGuideArticle(article(), "outro-endereco")).toBeNull();
    expect(parseGuideArticle(article({ slug: "Com Espaco" }), "Com Espaco")).toBeNull();
    expect(parseGuideArticle(article({ publishedAt: "ontem" }), "custo-da-embalagem")).toBeNull();
    expect(
      parseGuideArticle(article({ sections: [article().sections[0]] }), "custo-da-embalagem"),
    ).toBeNull();
  });

  it("carrega só os arquivos válidos, sem sobrepor guias escritos à mão, do mais novo ao mais antigo", () => {
    // Arrange
    const folder = makeDir({
      "custo-da-embalagem.json": article(),
      "preco-da-marmita.json": article({ slug: "preco-da-marmita", publishedAt: "2026-10-06" }),
      "como-calcular-preco-de-venda.json": article({ slug: "como-calcular-preco-de-venda" }),
      "quebrado.json": "{ não é json",
      "README.md": "texto",
    });
    // Act
    const loaded = loadGuideArticles(folder);
    // Assert
    expect(loaded.map((a) => a.slug)).toEqual(["preco-da-marmita", "custo-da-embalagem"]);
  });

  it("sem pasta de guias o site segue sem páginas geradas", () => {
    expect(loadGuideArticles(null)).toEqual([]);
  });

  it("separa parágrafos por linha em branco", () => {
    expect(paragraphs("Um.\n\n Dois.\n \nTrês.")).toEqual(["Um.", "Dois.", "Três."]);
  });
});
