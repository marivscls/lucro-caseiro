// Local-only visual audit. Requires Playwright via GUIDANCE_PLAYWRIGHT_PATH or node resolution.
const { chromium } = require(process.env.GUIDANCE_PLAYWRIGHT_PATH || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const base = "http://localhost:8090";
const id = "00000000-0000-4000-8000-000000000099";
const user = {
  id,
  aud: "authenticated",
  role: "authenticated",
  email: "guidance-test@example.invalid",
  created_at: "2026-01-01T00:00:00Z",
  app_metadata: {},
  user_metadata: {
    onboarding_completed: true,
    business_onboarding: {
      version: 1,
      status: "completed",
      answers: { segment: "craft", stage: "starting", goal: "money", channels: [] },
    },
  },
};
const token =
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url") +
  "." +
  Buffer.from(
    JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 86400 }),
  ).toString("base64url") +
  ".test-signature";
const session = {
  access_token: token,
  refresh_token: "test-only-refresh",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  user,
};
const state = {
  productLimitReached: false,
  failNextProduct: false,
  products: [],
  materials: [],
  services: [],
  finance: [],
  labels: [],
  events: [],
  failures: [],
  plan: "professional",
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
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
    reducedMotion: "reduce",
  });
  await context.addInitScript(
    ({ session }) => {
      if (location.hostname === "localhost") {
        localStorage.setItem("sb-guidance-test-auth-token", JSON.stringify(session));
      }
    },
    { session },
  );
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === base) return route.continue();
    if (url.hostname === "guidance-test.supabase.co")
      return route.fulfill({
        status: 200,
        json: url.pathname.endsWith("/user") ? user : session,
        headers,
      });
    if (url.origin !== "http://localhost:3099") return route.abort();
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    const method = route.request().method();
    const p = url.pathname.replace("/api/v1", "");
    let result = {};
    const body = route.request().postDataJSON();

    if (p.includes("/analytics")) {
      if (body?.events) state.events.push(...body.events);
      result = { allowed: false };
    } else if (p === "/subscription/profile")
      result = {
        id,
        userId: id,
        email: user.email,
        name: "Teste de orientação",
        businessName: "Ateliê de teste",
        businessType: "crafts",
        plan: state.plan,
        planExpiresAt: "2030-01-01T00:00:00Z",
        createdAt: "2026-01-01T00:00:00Z",
        phone: null,
      };
    else if (p === "/subscription/limits")
      result = {
        maxSalesPerMonth: state.plan === "free" ? 30 : null,
        maxClients: 20,
        maxRecipes: 5,
        maxPackaging: 3,
        maxProducts: state.plan === "free" ? 15 : null,
        maxSuppliers: 3,
        currentSalesThisMonth: 0,
        currentClients: 0,
        currentRecipes: 0,
        currentPackaging: 0,
        currentProducts: state.productLimitReached ? 15 : state.products.length,
        currentSuppliers: 0,
      };
    else if (
      p === "/products" ||
      p === "/materials" ||
      p === "/orders/services" ||
      p === "/labels" ||
      p === "/finance"
    ) {
      const key =
        p === "/finance" ? "finance" : p === "/orders/services" ? "services" : p.slice(1);
      if (method === "POST" && key === "products" && state.failNextProduct) {
        return route.fulfill({
          status: 503,
          json: { message: "Falha de rede simulada" },
          headers,
        });
      }
      if (method === "POST") {
        result = {
          id: crypto.randomUUID(),
          userId: id,
          createdAt: new Date().toISOString(),
          isActive: true,
          stockQuantity: null,
          publicEnabled: true,
          variations: [],
          addOns: [],
          active: true,
          ...body,
        };
        state[key].push(result);
      } else result = pageData(state[key]);
    } else if (p.startsWith("/products/") && !p.includes("low-stock"))
      result = state.products.find((x) => x.id === p.split("/").pop()) ?? [];
    else if (p === "/catalog/settings")
      result = {
        userId: id,
        slug: "orientacao-teste",
        enabled: true,
        brandId: "lucro-caseiro",
        whatsapp: null,
        customization: null,
      };
    else if (p === "/labels/templates") result = [{ id: "classico", name: "Clássico" }];
    else if (p.includes("recurring") || p.includes("low-stock")) result = [];
    else if (p === "/orders") result = pageData();
    else if (p === "/finance/summary") {
      const totalIncome = state.finance
        .filter((x) => x.type === "income")
        .reduce((sum, x) => sum + x.amount, 0);
      const totalExpenses = state.finance
        .filter((x) => x.type === "expense")
        .reduce((sum, x) => sum + x.amount, 0);
      result = {
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
        fixedExpenses: 0,
        variableExpenses: totalExpenses,
        period: "2026-09",
      };
    } else if (p === "/suppliers/overview")
      result = { items: [], month: { totalSpent: 0, totalPurchases: 0 } };
    else if (p.includes("/insights"))
      result = {
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0,
        monthlyData: [],
        topProducts: [],
        bestClients: [],
      };
    else if (p.includes("summary"))
      result = {
        totalIncome: 0,
        totalExpenses: 0,
        totalAmount: 0,
        totalSales: 0,
        totalOrders: 0,
        byCategory: [],
        byPaymentMethod: [],
        daily: [],
      };
    else if (p.includes("preferences")) result = { channelFees: [] };
    else if (p.includes("prolabore")) result = { config: null, progress: null };
    else result = pageData();
    return route.fulfill({ status: 200, json: result, headers });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(120000);
  const passed = [];
  const accessibilityOnly = process.argv.includes("--accessibility-only");
  const audit = [];
  page.on("pageerror", (error) => state.failures.push(error.message));
  const out = path.resolve("docs/guidance-validation");
  fs.mkdirSync(out, { recursive: true });
  if (!accessibilityOnly) {
    await page.goto(base + "/products");
    await page
      .getByRole("button", { name: "Cadastrar primeiro produto", exact: true })
      .waitFor({ timeout: 120000 });
    await page.screenshot({
      animations: "disabled",
      path: path.join(out, "products-empty-390.png"),
    });
    // Dismissal persists through reload; voluntary help remains available.
    await page.getByRole("button", { name: "Agora não", exact: true }).click();
    await page.reload();
    await page.getByRole("button", { name: /Como usar: Cadastre/ }).waitFor();
    if (
      await page
        .getByRole("button", { name: "Cadastrar primeiro produto", exact: true })
        .count()
    )
      throw new Error("Dispensa não persistiu");
    await page.getByRole("button", { name: /Como usar: Cadastre/ }).click();
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await page.waitForFunction(() =>
      document.activeElement?.getAttribute("aria-label")?.startsWith("Como usar:"),
    );
    await page.getByRole("button", { name: /Como usar: Cadastre/ }).click();
    await page
      .getByRole("button", { name: "Cadastrar primeiro produto", exact: true })
      .click();
    await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
    await page.getByText("Informe o nome do que você vende.", { exact: true }).waitFor();
    await page.evaluate(() => {
      window.focusLog = [];
      document.addEventListener("focusin", (e) =>
        window.focusLog.push([
          e.target.tagName,
          e.target.getAttribute("aria-label"),
          e.target.textContent?.slice(0, 60),
        ]),
      );
    });
    const nameField = page.getByRole("textbox", { name: /Nome do.*obrigatório/ });
    await page.waitForFunction(() =>
      document.activeElement?.getAttribute("aria-label")?.startsWith("Nome do"),
    );
    await nameField.fill("Peça de teste");
    await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
    await page.getByText("Presentes", { exact: true }).click();
    // Selecting a suggested category immediately closes the picker.
    await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
    const priceField = page.getByRole("textbox", {
      name: "Preço de venda em reais, obrigatório",
    });
    try {
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") ===
          "Preço de venda em reais, obrigatório",
        {},
        { timeout: 4000 },
      );
    } catch {
      console.log(
        "FOCUS_FAILURE",
        await page.evaluate(() => ({
          active: document.activeElement?.getAttribute("aria-label"),
          log: window.focusLog,
        })),
      );
      throw new Error("Preço inválido sem foco");
    }
    await page.screenshot({
      animations: "disabled",
      path: path.join(out, "product-price-error-390.png"),
    });
    await priceField.fill("25,00");
    await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
    state.failNextProduct = true;
    await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
    try {
      await page
        .getByText("Falha de rede simulada", { exact: true })
        .waitFor({ timeout: 15000 });
    } catch {
      console.log("SAVE_FAILURE", {
        state,
        ui: (await page.locator("body").innerText()).slice(-1000),
      });
      throw new Error("Falha simulada sem mensagem");
    }
    state.failNextProduct = false;
    if (state.events.some((e) => e.name === "guidance_products_task_completed"))
      throw new Error("Conclusão antes de salvar");
    await page.getByRole("button", { name: "OK", exact: true }).click();
    if ((await nameField.inputValue()) !== "Peça de teste")
      throw new Error("Rascunho perdido na falha");
    await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
    await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
    await page.getByText("Produto cadastrado!", { exact: true }).waitFor();
    if (state.products.length !== 1) throw new Error("Produto não persistido");
    await page.getByRole("button", { name: "Agora não", exact: true }).click();
    await page.goto(base + "/products");
    await page.getByRole("button", { name: /Como usar: Cadastre/ }).waitFor();
    if (
      await page
        .getByRole("button", { name: "Cadastrar primeiro produto", exact: true })
        .count()
    )
      throw new Error("Convite inicial reapareceu com produto salvo");
    // Label prerequisite cancellation and completion keep the originating draft.
    state.products = [];
    await page.goto(base + "/labels");
    await page.getByRole("button", { name: "Criar etiqueta", exact: true }).click();
    try {
      await page
        .getByRole("textbox", { name: "Nome da etiqueta" })
        .fill("Etiqueta de teste", { timeout: 7000 });
    } catch {
      console.log(
        "LABEL_OPEN_FAILURE",
        state.failures,
        (await page.locator("body").innerText()).slice(-1800),
      );
      await page.screenshot({
        animations: "disabled",
        path: path.join(out, "label-debug.png"),
      });
      throw new Error("Campo de etiqueta indisponível");
    }
    await page
      .getByRole("button", { name: "Cadastrar produto e continuar", exact: true })
      .click();
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    if (
      (await page.getByRole("textbox", { name: "Nome da etiqueta" }).inputValue()) !==
      "Etiqueta de teste"
    )
      throw new Error("Etiqueta perdeu nome após cancelar pré-requisito");
    await page
      .getByRole("button", { name: "Cadastrar produto e continuar", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: /Nome do.*obrigatório/ })
      .fill("Produto da etiqueta teste");
    await page.getByRole("button", { name: "Escolher categoria", exact: true }).click();
    await page.getByText("Presentes", { exact: true }).click();
    await page
      .getByRole("textbox", { name: "Preço de venda em reais, obrigatório" })
      .fill("18,00");
    await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
    await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
    await page
      .getByText("Produto cadastrado e selecionado. Continue sua etiqueta abaixo.", {
        exact: true,
      })
      .waitFor();
    if (
      (await page.getByRole("textbox", { name: "Nome da etiqueta" }).inputValue()) !==
      "Etiqueta de teste"
    )
      throw new Error("Etiqueta perdeu rascunho após criar produto");

    await page.screenshot({
      animations: "disabled",
      path: path.join(out, "label-resumed-390.png"),
    });

    passed.push(
      "Produto: validação, foco, falha de rede, rascunho e conclusão após sucesso",
      "Ajuda: dispensa, reabertura e retorno de foco",
      "Etiqueta: cancelar e retomar pré-requisito preservando rascunho",
    );
    await page.getByRole("button", { name: "Criar etiqueta", exact: true }).click();
    await page.getByText("Etiqueta criada!", { exact: true }).waitFor();
    if (state.labels.length !== 1) throw new Error("Etiqueta não persistiu");
    await page.getByRole("button", { name: "OK", exact: true }).click();
    // Service is useful without a preset price.
    await page.goto(base + "/services");
    await page
      .getByRole("button", { name: "Cadastrar serviço", exact: true })
      .first()
      .click();
    await page
      .getByRole("textbox", { name: "Nome do serviço", exact: true })
      .fill("Atendimento de teste");
    await page
      .getByRole("textbox", { name: "Duração em minutos", exact: true })
      .fill("45");
    await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
    await page.getByText("Atendimento de teste", { exact: true }).waitFor();
    if (state.services.length !== 1 || state.services[0].defaultPrice !== null)
      throw new Error("Serviço sem preço não persistiu");
    passed.push("Serviço persistido com duração e preço ainda indefinido");
    // Finance: incompatible category clears explicitly; other fields survive.
    await page.goto(base + "/finance");
    await page.getByRole("button", { name: "Registrar entrada", exact: true }).click();
    await page
      .getByRole("button", { name: "Registrar lançamento", exact: true })
      .last()
      .click();
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("aria-label") === "Valor em reais",
    );
    await page
      .getByRole("textbox", { name: "Valor em reais", exact: true })
      .fill("30,00");
    await page
      .getByRole("textbox", { name: "Descrição do lançamento", exact: true })
      .fill("Movimento de teste");
    await page.getByRole("button", { name: "Venda / atendimento", exact: true }).click();
    await page.getByText("Saída", { exact: true }).click();
    await page
      .getByText("O tipo mudou. Escolha uma categoria compatível.", { exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Material", exact: true }).click();
    await page
      .getByRole("button", { name: "Registrar lançamento", exact: true })
      .last()
      .click();
    await page.getByText("Movimento de teste", { exact: true }).waitFor();
    if (state.finance[0]?.type !== "expense" || state.finance[0]?.category !== "material")
      throw new Error("Financeiro incompatível");
    passed.push(
      "Financeiro: erro com foco, troca de tipo, categoria compatível e persistência",
    );
    // Manual pricing retains the distinction between missing and explicitly zero fees.
    await page.goto(base + "/pricing");
    await page.getByRole("button", { name: "Começar cálculo", exact: true }).click();
    await page
      .getByRole("textbox", {
        name: "Custo dos materiais por unidade em reais",
        exact: true,
      })
      .fill("10,00");
    await page.getByPlaceholder("Ex: 8,00", { exact: true }).fill("5,00");
    await page.getByText(/Taxa ainda não informada/).waitFor();
    await page
      .getByRole("button", { name: "Conferi meu resultado", exact: true })
      .click();
    await page.getByRole("button", { name: /Tenho taxa de venda/ }).click();
    await page.getByPlaceholder("Ex: 12", { exact: true }).fill("0");
    await page.getByText("Taxa informada: 0%.", { exact: true }).waitFor();
    await page.screenshot({
      animations: "disabled",
      path: path.join(out, "pricing-result-390.png"),
    });
    passed.push(
      "Precificação manual: resultado reconhecido sem salvar e taxa zero explícita",
    );
    // Material prerequisite returns to a draft cost sheet.
    await page.goto(base + "/recipes");
    await page.getByRole("button", { name: "Criar ficha de custo", exact: true }).click();
    const recipeName = page.getByRole("textbox", { name: /Nome da ficha/ });
    await recipeName.fill("Ficha de teste");
    await page.getByRole("button", { name: /Cadastrar material e continuar/ }).click();
    await page
      .getByRole("textbox", { name: "Nome do material", exact: true })
      .fill("Material de teste");
    await page.getByRole("button", { name: "Salvar material", exact: true }).click();
    await page.getByText("Material de teste", { exact: true }).waitFor();
    if ((await recipeName.inputValue()) !== "Ficha de teste")
      throw new Error("Ficha perdeu rascunho ao cadastrar material");
    await page.screenshot({
      animations: "disabled",
      path: path.join(out, "recipe-resumed-390.png"),
    });
    passed.push("Ficha de custo: material criado e selecionado, rascunho preservado");

    if (process.argv.includes("--flows-only")) {
      fs.writeFileSync(
        path.join(out, "task-flows.json"),
        JSON.stringify(passed, null, 2),
      );
      await browser.close();
      return;
    }
    const routes = [
      "/tabs",
      "/products",
      "/services",
      "/tabs/sales",
      "/tabs/new-sale",
      "/tabs/agenda",
      "/tabs/clients",
      "/pricing",
      "/pricing-complete",
      "/finance",
      "/recurring-expenses",
      "/materials",
      "/recipes",
      "/packaging",
      "/suppliers",
      "/purchases",
      "/fiado",
      "/quotes",
      "/catalog",
      "/labels",
      "/insights",
      "/support",
    ];
    for (const route of routes) {
      console.log("ROUTE", route);
      const previousErrors = state.failures.length;
      await page.goto(base + route);
      try {
        await page
          .getByRole("button", { name: /Como usar:/ })
          .first()
          .waitFor({ timeout: 15000 });
      } catch {
        if (route !== "/support")
          audit.push({
            route,
            issue: "Como usar não encontrado",
            text: (await page.locator("body").innerText()).slice(0, 650),
          });
      }
      const screenshot = route.replaceAll("/", "-").slice(1) + "-390.png";
      await page.screenshot({ animations: "disabled", path: path.join(out, screenshot) });
      audit.push({
        route,
        errors: [
          ...state.failures.slice(previousErrors),
          ...((await page.getByText(/Algo deu errado|Não foi possível carregar/).count())
            ? ["Estado de erro de carregamento visível"]
            : []),
        ],
        horizontalOverflow: await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
      });
    }
    // Additional responsive/theme coverage using the same isolated fixtures.
    for (const [width, height, scheme] of [
      [320, 740, "light"],
      [1280, 900, "light"],
      [390, 844, "dark"],
    ]) {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme: scheme });
      for (const route of [
        "/products",
        "/services",
        "/finance",
        "/pricing",
        "/catalog",
        "/support",
      ]) {
        console.log("VIEWPORT", width, scheme, route);
        await page.goto(base + route);
        await page
          .getByText(route === "/support" ? "Perguntas frequentes" : "Como usar", {
            exact: true,
          })
          .first()
          .waitFor({ timeout: 15000 });
        await page.screenshot({
          animations: "disabled",
          path: path.join(out, route.slice(1) + "-" + width + "-" + scheme + ".png"),
        });
        if (
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
        )
          throw new Error("Overflow em " + route + width + scheme);
      }
    }
  }
  state.plan = "free";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/support");
  await page
    .getByRole("button", { name: "Relatar uma dificuldade", exact: true })
    .waitFor();
  await page.screenshot({
    animations: "disabled",
    path: path.join(out, "support-free-390.png"),
  });
  // Guidance keeps paid limits, and remains available on the free plan.
  state.productLimitReached = true;
  await page.goto(base + "/products");
  await page.getByRole("button", { name: /Como usar: Cadastre/ }).click();
  await page
    .getByRole("dialog", { name: "Como usar esta tela" })
    .getByRole("button", { name: "Cadastrar primeiro produto", exact: true })
    .click();
  const blockedEvent = page.waitForRequest(
    (request) =>
      request.url().includes("analytics") &&
      request
        .postDataJSON()
        ?.events?.some((event) => event.name === "plan_limit_reached"),
  );
  const beforeLimitAttempt = state.products.length;
  await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
  await blockedEvent;
  await page
    .getByText("Mais controle para o seu negócio", { exact: true })
    .last()
    .waitFor();
  if (state.products.length !== beforeLimitAttempt)
    throw new Error("Ajuda ignorou limite de produtos");
  passed.push(
    "Plano gratuito: suporte básico disponível e ajuda respeita limite de produtos",
  );
  state.productLimitReached = false;
  state.products = [];
  state.services = [];
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(base + "/catalog");
  await page
    .getByRole("button", { name: "Cadastrar primeiro produto", exact: true })
    .waitFor();
  const guide = page.getByTestId("screen-guidance-catalog");
  await guide.evaluate((root) => {
    for (const el of root.querySelectorAll('[dir="auto"]')) {
      if (!el.textContent?.match(/[a-záéíóúãõç]/i)) continue;
      const css = getComputedStyle(el);
      el.style.fontSize = parseFloat(css.fontSize) * 1.5 + "px";
      el.style.lineHeight = parseFloat(css.lineHeight || css.fontSize) * 1.5 + "px";
    }
  });
  await page.screenshot({
    animations: "disabled",
    path: path.join(out, "catalog-empty-320-text150.png"),
  });
  await guide.getByRole("button", { name: "Agora não", exact: true }).click();
  await page.getByRole("button", { name: /Como usar:/ }).click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  passed.push(
    "Catálogo vazio: texto ampliado 150%, ajuda e dispensa utilizáveis em 320 px",
  );
  // A short browser viewport approximates available height; it is not a native keyboard test.
  await page.setViewportSize({ width: 390, height: 440 });
  await page.goto(base + "/finance");
  await page.getByRole("button", { name: /Como usar:/ }).click();
  await page
    .getByRole("dialog", { name: "Como usar esta tela" })
    .getByRole("button", { name: "Registrar entrada", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Registrar lançamento", exact: true })
    .last()
    .click();
  try {
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("aria-label") === "Valor em reais",
    );
  } catch (error) {
    console.log(
      "SHORT_VIEWPORT_FOCUS",
      await page.evaluate(() => ({
        active: document.activeElement?.outerHTML?.slice(0, 500),
        body: document.body.innerText.slice(-1300),
      })),
    );
    await page.screenshot({
      animations: "disabled",
      path: path.join(out, "finance-short-debug.png"),
    });
    throw error;
  }

  await page.waitForFunction(() => {
    const field = document.querySelector('input[aria-label="Valor em reais"]');
    if (!field) return false;
    let ancestor = field.parentElement;
    while (ancestor && !["auto", "scroll"].includes(getComputedStyle(ancestor).overflowY))
      ancestor = ancestor.parentElement;
    if (!ancestor) return false;
    const bounds = field.getBoundingClientRect(),
      viewport = ancestor.getBoundingClientRect();
    return bounds.top >= viewport.top - 1 && bounds.bottom <= viewport.bottom + 1;
  });
  await page.screenshot({
    animations: "disabled",
    path: path.join(out, "finance-short-viewport-390.png"),
  });
  passed.push(
    "Formulário com altura reduzida: correção de valor acessível (simulação web)",
  );
  console.log("AUDIT", JSON.stringify(audit));
  fs.writeFileSync(
    path.join(out, accessibilityOnly ? "accessibility.json" : "flows.json"),
    JSON.stringify(passed, null, 2),
  );
  if (audit.some((x) => x.issue || x.horizontalOverflow || x.errors?.length))
    throw new Error("Auditoria de rotas encontrou falha");
  if (state.failures.length) throw new Error("Erro de execução detectado");
  if (!accessibilityOnly)
    fs.writeFileSync(path.join(out, "routes.json"), JSON.stringify(audit, null, 2));
  fs.writeFileSync(
    path.join(
      out,
      accessibilityOnly ? "accessibility-events.json" : "initial-audit.json",
    ),
    JSON.stringify({ errors: state.failures, events: state.events }, null, 2),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
