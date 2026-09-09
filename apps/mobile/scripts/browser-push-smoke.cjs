// Local UI test only: authentication, APIs and browser push transport are fixtures.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
require("node:process").loadEnvFile(path.join(__dirname, "../.env"));
const base = process.env.VALIDATION_PREVIEW_URL || "http://localhost:8093";
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
        segment: "craft",
        stage: "starting",
        goal: "money",
        channels: [],
      },
    },
  },
};
const token = [
  Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
  Buffer.from(
    JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 86400 }),
  ).toString("base64url"),
  "test-signature",
].join(".");
const session = {
  access_token: token,
  refresh_token: "test-only",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  user,
};
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "*",
};
const out = path.resolve(__dirname, "../../../docs/browser-push-validation");
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = [];
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      const writes = [];
      const errors = [];
      await context.addInitScript(
        ({ session, id, key }) => {
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
          let subscription = null;
          window.__pushFixture = { permission: "default", requests: 0 };
          Object.defineProperty(Notification, "permission", {
            get: () => window.__pushFixture.permission,
          });
          Notification.requestPermission = () => {
            window.__pushFixture.requests++;
            if (window.__pushFixture.permission !== "denied")
              window.__pushFixture.permission = "granted";
            return Promise.resolve(window.__pushFixture.permission);
          };
          const registration = {
            active: {},
            pushManager: {
              getSubscription: () => Promise.resolve(subscription),
              subscribe: () => {
                subscription = {
                  endpoint: "https://fcm.googleapis.com/test",
                  toJSON: () => ({
                    keys: { p256dh: "B" + "a".repeat(86), auth: "a".repeat(22) },
                  }),
                  unsubscribe: () => {
                    subscription = null;
                    return Promise.resolve(true);
                  },
                };
                return Promise.resolve(subscription);
              },
            },
          };
          navigator.serviceWorker.getRegistration = () => Promise.resolve(registration);
        },
        { session, id, key: `sb-${authHost.split(".")[0]}-auth-token` },
      );
      await context.route("**/*", (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.origin === base) return route.continue();
        if (request.method() === "OPTIONS")
          return route.fulfill({ status: 204, headers });
        if (url.hostname === authHost)
          return route.fulfill({
            json: url.pathname.endsWith("/user") ? user : session,
            headers,
          });
        if (!url.pathname.startsWith("/api/v1")) return route.abort();
        const p = url.pathname.replace("/api/v1", "");
        if (p.startsWith("/notifications/web")) {
          if (p.endsWith("/config"))
            return route.fulfill({ json: { publicKey: "AQID" }, headers });
          writes.push({
            path: p,
            method: request.method(),
            body: request.postDataJSON(),
          });
          return route.fulfill({ status: 204, headers });
        }
        let result = { items: [], total: 0, page: 1, limit: 100, totalPages: 1 };
        if (p === "/subscription/profile")
          result = {
            id,
            userId: id,
            name: "Teste",
            businessName: "Ateliê",
            businessType: "crafts",
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
        return route.fulfill({ json: result, headers });
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base + "/settings");
      await page.waitForLoadState("networkidle");
      await page
        .getByRole("button", { name: "Ativar notificações", exact: true })
        .waitFor({ timeout: 45000 });
      assert.equal(await page.evaluate(() => window.__pushFixture.requests), 0);
      await page
        .getByRole("button", { name: "Ativar notificações", exact: true })
        .click();
      await page.getByRole("button", { name: "Enviar teste", exact: true }).waitFor();
      assert(writes.some((write) => write.method === "PUT"));
      await page.getByRole("button", { name: "Enviar teste", exact: true }).click();
      await page
        .getByText("Teste enviado. Confira a central de notificações do dispositivo.", {
          exact: true,
        })
        .waitFor();
      assert(writes.some((write) => write.path.endsWith("/test")));
      await page.getByRole("switch", { name: "Lembretes diários", exact: true }).click();
      await page
        .getByText(
          "Ativadas neste navegador. Avisos às 9h e lembrete diário às 19h, conforme suas preferências.",
          { exact: true },
        )
        .waitFor();
      assert(writes.some((write) => write.body?.prefs?.DAILY_REMINDER === false));
      await page
        .getByText("Notificações no navegador", { exact: true })
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(out, `settings-${width}.png`),
        fullPage: true,
      });
      await page.getByRole("button", { name: "Desativar", exact: true }).click();
      await page
        .getByText("Notificações desativadas neste navegador.", { exact: true })
        .waitFor();
      assert(writes.some((write) => write.method === "DELETE"));
      await page.evaluate(() => {
        window.__pushFixture.permission = "denied";
      });
      await page
        .getByRole("button", { name: "Ativar notificações", exact: true })
        .click();
      await page
        .getByText(
          "Notificações bloqueadas. Permita as notificações nas configurações deste site no navegador.",
          { exact: true },
        )
        .waitFor();
      assert.equal(
        await page
          .getByText("Lembretes com o app fechado estarão disponíveis em breve.", {
            exact: true,
          })
          .count(),
        0,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
      );
      assert.deepEqual(errors, []);
      report.push({
        width,
        passed: true,
        checks: [
          "explicit permission",
          "activation",
          "test push",
          "preferences",
          "disable",
          "permission denied",
          "no overflow",
          "no page errors",
        ],
      });
      await context.close();
    }
    fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
