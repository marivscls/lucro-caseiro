// Local-only browser verification; all external requests are intercepted.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");
loadEnvFile(path.join(__dirname, "../.env"));
const base = process.env.VALIDATION_PREVIEW_URL || "http://localhost:8097";
const authHost = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL).hostname;
const id = "00000000-0000-4000-8000-000000000099";
const user = {
  id,
  aud: "authenticated",
  role: "authenticated",
  email: "validation@example.invalid",
  created_at: "2026-01-01T00:00:00Z",
  app_metadata: {},
  user_metadata: {
    name: "Teste",
    onboarding_completed: true,
    business_onboarding: {
      version: 1,
      status: "completed",
      answers: {
        name: "Teste",
        segment: "food",
        stage: "starting",
        goal: "money",
        channels: [],
      },
    },
  },
};
const token = [
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
  Buffer.from(
    JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 86400 }),
  ).toString("base64url"),
  "test-signature",
].join(".");
const session = {
  access_token: token,
  refresh_token: "local-test-only",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  user,
};
const pageData = (items = []) => ({
  items,
  total: items.length,
  page: 1,
  limit: 100,
  totalPages: 1,
});
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "*",
};
const scenario = process.env.CATALOG_SCENARIO || "populated";
const out = path.resolve(__dirname, "../../../docs/forms-ui-validation");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of (process.env.FORM_WIDTHS || "320,390,500,1440")
      .split(",")
      .map(Number)) {
      const context = await browser.newContext({
        viewport: { width, height: 844 },
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      const errors = [];
      await context.addInitScript(
        ({ scenario, id }) => {
          localStorage.setItem("themeMode", scenario === "dark" ? "dark" : "light");
          localStorage.setItem(
            `screen-guidance:v1:${id}`,
            JSON.stringify({ catalog: { dismissed: true } }),
          );
        },
        { scenario, id },
      );
      const writes = [];
      await context.addInitScript(
        ({ session, key, id }) => {
          localStorage.setItem(key, JSON.stringify(session));
          localStorage.setItem(
            "onboarding-state",
            JSON.stringify({
              state: {
                completed: true,
                completedUserIds: [id],
                pendingUserIds: [],
                gettingStartedDismissedUserIds: [id],
                gettingStartedStartedUserIds: [],
                gettingStartedCompletedUserIds: [],
                currentStep: 0,
              },
              version: 0,
            }),
          );
        },
        { session, key: `sb-${authHost.split(".")[0]}-auth-token`, id },
      );
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === base) return route.continue();
        if (route.request().method() === "OPTIONS")
          return route.fulfill({ status: 204, headers });
        if (url.hostname === authHost)
          return route.fulfill({
            json: url.pathname.endsWith("/user") ? user : session,
            headers,
          });
        if (!url.pathname.startsWith("/api/v1")) return route.abort();
        const p = url.pathname.replace("/api/v1", "");
        if (
          !["GET", "OPTIONS"].includes(route.request().method()) &&
          !p.includes("analytics")
        )
          writes.push(p);
        let result = pageData();
        if (p === "/products")
          result = pageData(
            Array.from({ length: scenario === "empty" ? 0 : 18 }, (_, index) => ({
              id: "product-" + index,
              userId: id,
              name: ["Bolo de chocolate", "Brigadeiro artesanal", "Bolo de cenoura"][
                index % 3
              ],
              category: "Doces",
              salePrice: 25,
              costPrice: 10,
              publicEnabled: index < 17,
              isActive: true,
              variations: [],
              addOns: [],
              photoUrl: null,
            })),
          );
        else if (p === "/orders/services")
          result = pageData(
            Array.from({ length: scenario === "empty" ? 0 : 4 }, (_, index) => ({
              id: "service-" + index,
              userId: id,
              name: "Decoração de festas",
              durationMinutes: 60,
              defaultPrice: 150,
              active: true,
              publicEnabled: true,
            })),
          );
        else if (p === "/materials")
          result = pageData(
            Array.from({ length: scenario === "empty" ? 0 : 16 }, (_, index) => ({
              id: `material-${index}`,
              userId: id,
              name: index === 0 ? "Morango" : `Farinha ${index}`,
              unit: "kg",
              stockQuantity: index === 0 ? 1 : 10,
              stockAlertThreshold: 1,
              costPerUnit: 10,
              contentPerUnit: null,
              contentUnit: null,
              notes: null,
              icon: null,
              createdAt: "2026-01-01T00:00:00Z",
            })),
          );
        else if (p === "/subscription/profile")
          result = {
            id,
            userId: id,
            name: "Teste",
            businessName: "Ateliê",
            businessType: "food",
            plan: "professional",
            planExpiresAt: "2030-01-01T00:00:00Z",
            createdAt: "2026-01-01T00:00:00Z",
            phone: null,
          };
        else if (p === "/subscription/limits")
          result = {
            maxSalesPerMonth: null,
            maxClients: null,
            maxRecipes: null,
            maxPackaging: null,
            maxProducts: null,
            maxSuppliers: null,
            currentSalesThisMonth: 0,
            currentClients: 0,
            currentRecipes: 0,
            currentPackaging: 0,
            currentProducts: 0,
            currentSuppliers: 0,
          };
        else if (
          p.includes("low-stock") ||
          p.includes("recurring") ||
          p.includes("/orders/services")
        )
          result = [];
        else if (p.includes("analytics")) result = { allowed: false };
        else if (p === "/catalog/settings")
          result = {
            userId: id,
            slug: "teste-local",
            enabled: scenario !== "disabled",
            brandId: "lucro-caseiro",
            whatsapp: null,
            customization: null,
          };
        if (p.includes("templates"))
          result = [
            { id: "classico", name: "Clássico" },
            { id: "minimalista", name: "Minimalista" },
          ];

        if (process.env.FORM_EDITS === "1") {
          const fixtures = {
            packaging: {
              id: "pack-1",
              userId: id,
              name: "Caixa kraft P",
              type: "box",
              unitCost: 1.4,
              supplier: null,
              supplierId: null,
              stockQuantity: 20,
              stockAlertThreshold: 2,
              createdAt: "2026-08-01T00:00:00Z",
            },
            recipes: {
              id: "recipe-1",
              userId: id,
              name: "Brigadeiro gourmet",
              category: "Doces",
              yieldQuantity: 30,
              yieldUnit: "unidades",
              instructions: "",
              ingredients: [],
              totalCost: 10,
              costPerUnit: 0.33,
              createdAt: "2026-08-01T00:00:00Z",
            },
            purchases: {
              id: "purchase-1",
              userId: id,
              description: "Pedido do fornecedor",
              category: "material",
              amount: 125,
              paymentStatus: "pending",
              paymentMethod: "pix",
              purchasedAt: "2026-08-01",
              dueDate: "2026-09-20",
              supplierId: null,
              items: [],
              createdAt: "2026-08-01T00:00:00Z",
            },
            labels: {
              id: "label-1",
              userId: id,
              name: "Rótulo de brigadeiro",
              templateId: "minimalista",
              productId: "product-0",
              data: { productName: "Brigadeiro gourmet" },
              createdAt: "2026-08-01T00:00:00Z",
            },
          };
          const kind = p.split("/")[1];
          if (fixtures[kind] && !p.includes("templates"))
            result =
              p.split("/").length === 2 ? pageData([fixtures[kind]]) : fixtures[kind];
        }
        return route.fulfill({ json: result, headers });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.setDefaultNavigationTimeout(120000);
      page.on("pageerror", (error) => errors.push(error.message));

      for (const route of (
        process.env.FORM_ROUTES ||
        "products,recurring-expenses,packaging,quotes,materials,purchases,recipes,labels"
      ).split(",")) {
        await page.goto(base + "/" + route, { waitUntil: "domcontentloaded" });
        await page.getByRole("button").first().waitFor({ timeout: 120000 });
        await page.evaluate(() => document.fonts.ready);

        if (process.env.FORM_EDITS === "1") {
          if (route === "packaging") {
            await page
              .getByRole("button", { name: "Ações de Caixa kraft P", exact: true })
              .click();
            await page.getByRole("button", { name: "Editar", exact: true }).click();
          } else if (route === "recipes") {
            await page
              .getByRole("button", {
                name: "Mais ações de Brigadeiro gourmet",
                exact: true,
              })
              .click();
            await page.getByRole("button", { name: "Editar", exact: true }).click();
          } else if (route === "purchases") {
            await page
              .getByRole("button", { name: "Editar compra", exact: true })
              .click();
          } else {
            await page
              .getByRole("button", {
                name: "Ver detalhes de Rótulo de brigadeiro",
                exact: true,
              })
              .click();
          }
          const modal = page.getByRole("dialog").last();
          await modal.waitFor();
          await modal.evaluate(async (el) => {
            const animations = [];
            for (let node = el; node; node = node.parentElement)
              animations.push(...node.getAnimations());
            await Promise.all(animations.map((a) => a.finished.catch(() => {})));
          });
          await page.screenshot({
            animations: "disabled",
            path: path.join(out, route + "-edit-" + width + ".png"),
          });
          if (route === "recipes" || route === "purchases") {
            await modal.getByRole("button", { name: "Continuar", exact: true }).click();
            await modal.getByRole("button", { name: "Voltar", exact: true }).waitFor();
            await modal.getByRole("button", { name: "Voltar", exact: true }).click();
          }
          console.log(
            JSON.stringify({
              route,
              width,
              check: "edit / preview opens, wizard back works",
            }),
          );
          await modal.getByRole("button", { name: "Fechar", exact: true }).click();
          continue;
        }
        const createNames = {
          products: "+ Novo produto",
          "recurring-expenses": "+ Novo gasto fixo",
          packaging: "Cadastrar embalagem",
          quotes: "Novo orçamento",
          materials: "+ Novo material",
          purchases: "Adicionar compra",
          recipes: "Cadastrar receita",
          labels: "Nova etiqueta",
        };
        await page
          .getByRole("button", { name: createNames[route], exact: true })
          .last()
          .click();
        const dialog = page.getByRole("dialog").last();
        await dialog.waitFor().catch(async (error) => {
          console.error(errors);
          console.error(await page.locator("body").innerText());
          await page.screenshot({
            animations: "disabled",
            path: path.join(out, route + "-failure.png"),
          });
          throw error;
        });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          animations: "disabled",
          path: path.join(
            out,
            route + "-" + (scenario === "dark" ? "dark-" : "") + width + ".png",
          ),
        });
        const bounds = await dialog.boundingBox();
        if (!bounds || bounds.x < -1 || bounds.x + bounds.width > width + 1)
          throw new Error("Dialog outside viewport: " + route + " " + width);
        const primary = dialog
          .getByRole("button", {
            name: /^(Continuar|Salvar gasto|Cadastrar|Salvar material|Salvar insumo)$/,
          })
          .last();
        const action = await primary.boundingBox();
        if (!action || action.height < 43 || action.y + action.height > 844)
          throw new Error("Action outside viewport: " + route + " " + width);
        if (route === "labels" && width < 768 && action.width < bounds.width - 45)
          throw new Error("Label action too narrow");

        if (width === 390) {
          await dialog.evaluate((el) => {
            const scroll = Array.from(el.querySelectorAll("div")).find(
              (node) =>
                node.scrollHeight > node.clientHeight + 1 &&
                ["auto", "scroll"].includes(getComputedStyle(node).overflowY),
            );
            if (scroll) scroll.scrollTop = scroll.scrollHeight;
          });
          const afterScroll = await primary.boundingBox();
          if (!afterScroll || Math.abs(afterScroll.y - action.y) > 1)
            throw new Error("Footer moves with form content: " + route);
        }
        console.log(JSON.stringify({ route, width, scenario, dialog: bounds, action }));
        await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
      }
      if (errors.length) throw new Error(errors.join("\n"));
      if (writes.length) throw new Error("Unexpected writes: " + writes.join(", "));
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
