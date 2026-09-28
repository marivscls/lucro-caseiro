import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { renderFiadoStatementHtml } from "./fiado-statement.renderer";
import type { FiadoStatement, IFiadoRepo } from "./fiado.types";
import { FiadoUseCases } from "./fiado.usecases";

const USER = "11111111-1111-4111-8111-111111111111";
const CLIENT = "22222222-2222-4222-8222-222222222222";
const TOKEN = "abcdefghijklmnop";

function statement(overrides: Partial<FiadoStatement> = {}): FiadoStatement {
  return {
    brandId: "lucro-caseiro",
    owner: {
      name: "Célia",
      businessName: "Marmitas da Célia",
      phone: "(11) 98765-4321",
      pix: { pixKeyType: "email", pixKey: "celia@doces.com", pixCity: "Recife" },
    },
    clientName: "Dona Rosa Silva",
    sales: [
      {
        soldAt: new Date("2026-09-12T15:00:00Z"),
        total: 45,
        paidAmount: 0,
        description: "3x Marmita",
      },
      {
        soldAt: new Date("2026-09-20T15:00:00Z"),
        total: 30,
        paidAmount: 0,
        description: "Bolo de pote",
      },
    ],
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IFiadoRepo> = {}): IFiadoRepo {
  return {
    getPixSettings: () => Promise.resolve(null),
    updatePixSettings: (_userId, data) => Promise.resolve(data),
    clientExists: () => Promise.resolve(true),
    findLinkToken: () => Promise.resolve(null),
    insertLink: (_u, _c, token) => Promise.resolve(token),
    findStatement: () => Promise.resolve(statement()),
    ...overrides,
  };
}

describe("FiadoUseCases", () => {
  it("devolve Pix vazio para quem ainda não cadastrou", async () => {
    const sut = new FiadoUseCases(makeRepo());
    await expect(sut.getPixSettings(USER)).resolves.toEqual({
      pixKeyType: null,
      pixKey: null,
      pixCity: null,
    });
  });

  it("recusa chave Pix inválida", async () => {
    const sut = new FiadoUseCases(makeRepo());
    await expect(
      sut.updatePixSettings(USER, { pixKeyType: "cpf_cnpj", pixKey: "123" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("reaproveita o link que o cliente já tem", async () => {
    const sut = new FiadoUseCases(
      makeRepo({ findLinkToken: () => Promise.resolve(TOKEN) }),
      () => "outro-token-novo",
    );
    await expect(sut.getOrCreateLink(USER, CLIENT, "lucro-caseiro")).resolves.toEqual({
      token: TOKEN,
      clientId: CLIENT,
    });
  });

  it("cria um link novo com a marca do app", async () => {
    let brand = "";
    const sut = new FiadoUseCases(
      makeRepo({
        insertLink: (_u, _c, token, brandId) => {
          brand = brandId;
          return Promise.resolve(token);
        },
      }),
      () => TOKEN,
    );
    await expect(sut.getOrCreateLink(USER, CLIENT, "lucro-manicure")).resolves.toEqual({
      token: TOKEN,
      clientId: CLIENT,
    });
    expect(brand).toBe("lucro-manicure");
  });

  it("não cria link para cliente de outra conta", async () => {
    const sut = new FiadoUseCases(
      makeRepo({ clientExists: () => Promise.resolve(false) }),
    );
    await expect(
      sut.getOrCreateLink(USER, CLIENT, "lucro-caseiro"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("não consulta o banco com token malformado", async () => {
    let called = false;
    const sut = new FiadoUseCases(
      makeRepo({
        findStatement: () => {
          called = true;
          return Promise.resolve(null);
        },
      }),
    );
    await expect(sut.getPublicStatement("x")).rejects.toBeInstanceOf(NotFoundError);
    expect(called).toBe(false);
  });
});

describe("página do extrato", () => {
  it("mostra total, compras, Pix com valor, aviso de pagamento e rodapé com convite", () => {
    const html = renderFiadoStatementHtml(statement(), "nonce123");
    expect(html).toContain("R$ 75,00");
    expect(html).toContain("3x Marmita");
    expect(html).toContain("Copiar código Pix");
    expect(html).toContain("540575.00");
    expect(html).toContain("https://wa.me/5511987654321?text=");
    expect(html).toContain("Feito com Lucro Caseiro");
    expect(html).toContain("utm_source=extrato_fiado");
    expect(html).toContain('nonce="nonce123"');
    expect(html).toContain("noindex");
  });

  it("sem chave Pix, orienta a combinar o pagamento", () => {
    const html = renderFiadoStatementHtml(
      statement({
        owner: {
          ...statement().owner,
          pix: { pixKeyType: null, pixKey: null, pixCity: null },
        },
      }),
      "n",
    );
    expect(html).not.toContain("Copiar código Pix");
    expect(html).toContain("Combine com Marmitas da Célia");
  });

  it("sem nada em aberto, mostra que está tudo certo", () => {
    const html = renderFiadoStatementHtml(statement({ sales: [] }), "n");
    expect(html).toContain("Tudo certo por aqui");
    expect(html).not.toContain("wa.me");
  });

  it("escapa nomes vindos do cadastro", () => {
    const html = renderFiadoStatementHtml(
      statement({ clientName: "<script>alert(1)</script>" }),
      "n",
    );
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
