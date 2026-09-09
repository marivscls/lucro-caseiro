// Local-only browser verification; all external requests are intercepted.
const {
  chromium,
} = require("C:/Users/maria/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");
loadEnvFile(path.join(__dirname, "../../apps/mobile/.env"));
const base = process.env.VALIDATION_PREVIEW_URL || "http://localhost:8092";
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
    name: "Mariana Vasconcelos",
    onboarding_completed: true,
    business_onboarding: {
      version: 1,
      status: "completed",
      answers: {
        name: "Mariana Vasconcelos",
        segment: "craft",
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
const out = path.resolve(__dirname, ".");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1440, 320]) {
      const context = await browser.newContext({
        viewport: { width, height: 1100 },
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      const errors = [];
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
        if (p === "/subscription/profile")
          result = {
            id,
            userId: id,
            name: "Mariana Vasconcelos",
            businessName: "Meu negócio",
            businessType: "",
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
            enabled: true,
            brandId: "lucro-caseiro",
            whatsapp: null,
            customization: null,
          };
        return route.fulfill({ json: result, headers });
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base + "/settings");
      await page
        .getByRole("button", { name: "Editar perfil", exact: true })
        .waitFor({ timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(out, `settings-light-${width}.png`) });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow) throw new Error(`Horizontal overflow at ${width}`);
      await page.getByRole("button", { name: "Tema escuro", exact: true }).click();
      await page.locator('[aria-label="Tema escuro"][aria-pressed="true"]').waitFor();
      await page
        .getByRole("button", { name: "Editar perfil", exact: true })
        .scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(out, `settings-dark-${width}.png`) });
      await page.getByRole("button", { name: "Tema claro", exact: true }).click();
      await page.getByRole("button", { name: "Editar perfil", exact: true }).click();
      await page.getByPlaceholder("Seu nome", { exact: true }).waitFor();
      if (
        (await page.getByPlaceholder("Seu nome", { exact: true }).inputValue()) !==
        "Mariana Vasconcelos"
      )
        throw new Error("Profile form lost data");
      await page.getByRole("button", { name: "Fechar", exact: true }).click();
      const deleteAction = page.getByRole("button", { name: "Excluir conta", exact: true });
      await deleteAction.scrollIntoViewIfNeeded();
      const deleteBounds = await deleteAction.boundingBox();
      if (width < 768 && deleteBounds.y + deleteBounds.height > 1010)
        throw new Error("Account action covered by bottom navigation");
      await page.screenshot({ path: path.join(out, `settings-bottom-${width}.png`) });
      await page
        .getByRole("button", { name: "Editar perfil do negócio", exact: true })
        .click();
      await page.getByText("Como podemos te chamar?", { exact: true }).waitFor();
      // The native modal uses a short fade; capture its settled appearance.
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(out, `business-profile-${width}.png`) });
      console.log(
        `PASS ${width}: renders without overflow, light/dark selection, populated edit profile and business profile action.`,
      );
      if (errors.length) throw new Error(errors.join("\n"));
      if (writes.length) throw new Error("Unexpected API writes: " + writes.join(", "));
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
