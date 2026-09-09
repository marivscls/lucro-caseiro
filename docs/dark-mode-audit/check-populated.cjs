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
const out = path.resolve(__dirname, "populated");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      const errors = [];
      const writes = [];
      await context.addInitScript(
        ({ session, key, id }) => {
          localStorage.setItem(key, JSON.stringify(session)); localStorage.setItem("themeMode", "dark");
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
        if (p === "/finance/summary") result = { totalIncome: 0, totalExpenses: 0, fixedExpenses: 0, variableExpenses: 0, profit: 0, period: "2026-09" };
        if (p === "/goals/prolabore") result = { config: null, progress: { requiredRevenue: 0, currentRevenue: 0, remainingRevenue: 0, progressPct: 0, salesNeeded: null, salesRemaining: null, avgTicket: null, reached: false, period: "2026-09" } };
        if (p === "/suppliers/overview") result = { month: {totalAmount: 0, purchaseCount: 0, supplierCount: 0, planningStatus: "none"}, items: [] };
        if (p === "/insights") result = { months: 6, totalRevenue: 0, totalSales: 0, topProducts: [], topClients: [], monthlyRevenue: [] };
        if (p === "/labels/templates") result = ["classico", "moderno", "minimalista", "artesanal", "gourmet"].map(id => ({id, name:id}));
        if (p.includes("birthday") || p.includes("velocity")) result = [];

        if (p === "/orders/services") result = {items: []};
        const supplier = {id, userId:id, name:"Papel & Cia", category:"packaging", phone:null, hasWhatsApp:false, email:null, address:null, purchaseDescription:"Caixas e embalagens", notes:null, isPreferred:true, avatarType:"initials", avatarPresetId:null, avatarUrl:null, needsFollowUp:true, restockSoon:false, isActive:true, createdAt:"2026-01-01T00:00:00Z", updatedAt:"2026-01-01T00:00:00Z", lastPurchase:null, totalPurchaseCount:0, totalPurchaseAmount:0, hasOpenOrder:false};
        if(p === "/suppliers/overview") result={month:{totalAmount:0,purchaseCount:0,supplierCount:2,planningStatus:"none"},items:[supplier,{...supplier,id:"00000000-0000-4000-8000-000000000098",name:"Ateliê das Flores",category:"food",avatarType:"preset",avatarPresetId:"supplies-mixing-bowl"}]};
        if(p === "/suppliers") result=pageData([supplier]);
        if(p === "/materials") result=pageData([{id,userId:id,name:"Fita de cetim",unit:"m",stockQuantity:12,stockAlertThreshold:2,costPerUnit:3.2,contentPerUnit:null,contentUnit:null,notes:null,icon:null,supplierId:null,createdAt:"2026-01-01T00:00:00Z"},{id:"00000000-0000-4000-8000-000000000098",userId:id,name:"Papel kraft",unit:"un",stockQuantity:1,stockAlertThreshold:4,costPerUnit:1.2,contentPerUnit:null,contentUnit:null,notes:null,icon:null,supplierId:null,createdAt:"2026-01-01T00:00:00Z"}]);
        if(p === "/packaging") result=pageData([{id,userId:id,name:"Caixa de presente",type:"box",unitCost:3.2,supplier:null,supplierId:null,photoUrl:null,createdAt:"2026-01-01T00:00:00Z"}]);
        if (p === "/orders/services") result = {items: []};
        return route.fulfill({ json: result, headers });

      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      const routes = ["/settings", "/suppliers", "/materials", "/packaging", "/pricing", "/services"];
      const report = [];
      for (const screen of routes) {
        errors.length = 0;
        try {
          await page.goto(base + screen);
          await page.waitForFunction(() => document.body.innerText.trim().length > 40, {timeout: 20000}); await page.waitForLoadState("networkidle");
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(350);
          if (["/suppliers", "/materials", "/packaging"].includes(screen)) {
            const labels={"/suppliers":"Papel & Cia","/materials":"Fita de cetim","/packaging":"Caixa de presente"};
            await page.getByText(labels[screen], {exact:true}).first().evaluate(el => el.scrollIntoView({block:"center"}));
          }
          const text = await page.locator("body").innerText();
          const file = screen.replaceAll("/", "-").slice(1) + `-dark-${width}.png`;
          await page.screenshot({ path: path.join(out, file) });
          const result = {screen, resolvedPath: new URL(page.url()).pathname, file, errors:[...errors], overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), text};
          report.push(result);
          console.log(screen, errors.length ? errors.join("; ").slice(0,200) : "rendered", text.slice(0,70).replaceAll("\n"," "));
        } catch (error) { report.push({screen, failure: error.message}); console.log(screen, "FAILED",error.message.slice(0,120)); }
      }
      fs.writeFileSync(path.join(out,`report-${width}.json`),JSON.stringify(report,null,2));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

