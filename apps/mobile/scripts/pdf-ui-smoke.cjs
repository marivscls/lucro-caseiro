// Local fixtures only. No customer data or network requests.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
require(process.env.TSX_PATH || "tsx/cjs");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const { buildQuoteHtml } = require("../src/features/quotes/quote-pdf.ts");
const { buildReceiptHtml } = require("../src/features/sales/receipt-pdf.ts");
const { buildRecipeHtml } = require("../src/features/recipes/recipe-pdf.ts");
const root = path.resolve(__dirname, "../../..");
const out = path.join(root, "docs/pdf-ui-validation");
const pdfOut = path.join(root, "output/pdf");
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(pdfOut, { recursive: true });
const business = { name: "Delícias da Mariana", phone: "(11) 98765-4321" };
const quote = {
  id: "a3c0350d-0000-4000-8000-000000000001",
  title: "Orçamento evento #1",
  clientName: "Ana Beatriz",
  createdAt: "2026-08-11T12:00:00Z",
  validUntil: "2026-08-24",
  items: [
    { description: "Bolo personalizado", quantity: 1, unitPrice: 125 },
    { description: "Doces gourmet", quantity: 55, unitPrice: 4.5 },
    { description: "Entrega", quantity: 1, unitPrice: 25 },
  ],
  subtotal: 397.5,
  discount: 0,
  total: 397.5,
  notes: "Proposta detalhada enviada pelo WhatsApp.",
};
const sale = {
  ...quote,
  soldAt: quote.createdAt,
  paymentMethod: "pix",
  status: "paid",
  discount: 20,
  total: 377.5,
  items: quote.items.map((item) => ({
    ...item,
    productName: item.description,
    subtotal: item.quantity * item.unitPrice,
  })),
};
const recipe = {
  name: "Bolo de chocolate",
  category: "Bolos",
  yieldQuantity: 20,
  yieldUnit: "fatias",
  totalCost: 42.5,
  costPerUnit: 2.125,
  ingredients: [
    { materialName: "Farinha de trigo", quantity: 400, unit: "g", cost: 3.6 },
    { materialName: "Chocolate em pó", quantity: 200, unit: "g", cost: 14.9 },
    { materialName: "Açúcar", quantity: 300, unit: "g", cost: 2.4 },
    { materialName: "Ovos", quantity: 4, unit: "un", cost: 4.8 },
    { materialName: "Leite", quantity: 250, unit: "ml", cost: 1.8 },
    { materialName: "Manteiga", quantity: 200, unit: "g", cost: 15 },
  ],
  instructions:
    "Misture os ingredientes secos.\nIncorpore os ovos, o leite e a manteiga.\nAsse em forno preaquecido a 180 °C por cerca de 40 minutos.",
};
const longName =
  "Encomenda personalizada com acabamento artesanal e embalagem especial para presente ".repeat(
    3,
  );
const longQuote = {
  ...quote,
  title: longName,
  clientName: longName,
  items: Array.from({ length: 45 }, (_, i) => ({
    description: `Item ${i + 1} - ${longName}`,
    quantity: 12,
    unitPrice: 125.75,
  })),
  subtotal: 67905,
  discount: 905,
  total: 67000,
  notes: "Condições especiais & observações <sem HTML>.\n".repeat(60),
};
const scenarios = {
  orcamento: buildQuoteHtml(quote, business),
  recibo: buildReceiptHtml(sale, business),
  ficha: buildRecipeHtml(recipe),
  "orcamento-longo": buildQuoteHtml(longQuote, { ...business, name: longName }),
  "recibo-longo": buildReceiptHtml(
    {
      ...sale,
      status: "pending",
      clientName: longName,
      items: longQuote.items.map((item) => ({
        ...item,
        productName: item.description,
        subtotal: item.quantity * item.unitPrice,
      })),
      subtotal: longQuote.subtotal,
      discount: longQuote.discount,
      total: longQuote.total,
    },
    { ...business, name: longName },
  ),
  "ficha-longa": buildRecipeHtml({
    ...recipe,
    name: longName,
    ingredients: Array.from({ length: 45 }, () => ({
      ...recipe.ingredients[0],
      materialName: longName,
    })),
    instructions: recipe.instructions.repeat(40),
  }),
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const [name, html] of Object.entries(scenarios)) {
      const page = await browser.newPage();
      // Serve the project's actual Manrope files locally; also validate fallback below.
      await page.route("**/*", async (route) => {
        if (route.request().url().includes("fonts.googleapis.com")) {
          const fontRoot = path.resolve(
            __dirname,
            "../node_modules/@expo-google-fonts/manrope",
          );
          const css = [
            [400, "Regular"],
            [600, "SemiBold"],
            [700, "Bold"],
            [800, "ExtraBold"],
          ]
            .map(([weight, label]) => {
              const file = path.join(
                fontRoot,
                `${weight}${label}`,
                `Manrope_${weight}${label}.ttf`,
              );
              return `@font-face{font-family:Manrope;font-weight:${weight};src:url(data:font/ttf;base64,${fs.readFileSync(file).toString("base64")})}`;
            })
            .join("\n");
          return route.fulfill({ contentType: "text/css", body: css });
        }
        return route.abort();
      });
      fs.writeFileSync(path.join(out, `${name}.html`), html);
      await page.setContent(html);
      await page.evaluate(() => document.fonts.ready);
      for (const width of [320, 390, 500, 768]) {
        await page.setViewportSize({ width, height: 844 });
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          nestedMain: !!document.querySelector("main main"),
          rows: document.querySelectorAll("tbody tr").length,
        }));
        assert.equal(result.overflow, false, `${name} overflows at ${width}px`);
        assert.equal(result.nestedMain, false, `${name} has nested main elements`);
        results.push({ name, width, ...result });
        if (!name.includes("longo") && !name.includes("longa")) {
          await page.screenshot({
            path: path.join(out, `${name}-${width}.png`),
            fullPage: true,
          });
        }
      }
      await page.emulateMedia({ media: "print" });
      const isLong = name.includes("longo") || name.includes("longa");
      await page.pdf({
        path: path.join(isLong ? out : pdfOut, `${name}.pdf`),
        preferCSSPageSize: true,
        printBackground: true,
      });
      await page.close();
    }
    const fallback = await browser.newPage({ viewport: { width: 320, height: 844 } });
    await fallback.route("**/*", (route) => route.abort());
    await fallback.setContent(scenarios.orcamento);
    assert.equal(
      await fallback.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await fallback.screenshot({
      path: path.join(out, "orcamento-offline.png"),
      fullPage: true,
    });
    fs.writeFileSync(
      path.join(out, "checks.json"),
      JSON.stringify({ checks: results, offlineFallback: "passed" }, null, 2),
    );
    console.log(
      `Validated ${results.length} layouts and offline font fallback. PDFs: ${pdfOut}`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
