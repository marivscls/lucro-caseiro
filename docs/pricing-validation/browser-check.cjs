// Isolated browser fixtures: every remote request is intercepted; no account is changed.
const { chromium } = require('C:/Users/maria/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const env = fs.readFileSync(path.join(root, 'apps/mobile/.env'), 'utf8');
const authUrl = env.match(/^EXPO_PUBLIC_SUPABASE_URL=(.+)$/m)[1].trim().replaceAll('"', '');
const authKey = `sb-${new URL(authUrl).hostname.split('.')[0]}-auth-token`;
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const user = { id: id(1), email: 'pricing-test@example.invalid', app_metadata: {}, user_metadata: { name: 'Conta de teste', onboarding_completed: true }, aud: 'authenticated', created_at: '2026-09-01T00:00:00Z' };
const token = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ sub: user.id, exp: 4102444800, role: 'authenticated' })).toString('base64url'), 'fixture'].join('.');
const profile = { id: user.id, email: user.email, name: 'Conta de teste', phone: null, businessName: 'Confeitaria de teste', businessType: 'confeitaria', avatarUrl: null, plan: 'professional', planExpiresAt: null, createdAt: user.created_at };
const product = { id: id(2), userId: user.id, name: 'Bolo de cenoura', category: 'bolos', description: null, recipeId: id(3), costPrice: 10, salePrice: 18, isComposite: false, components: [], variations: [], sellByWeight: false, stockQuantity: 10, createdAt: user.created_at };
const recipe = { id: id(3), userId: user.id, name: 'Massa de cenoura', category: 'bolos', yieldQuantity: 10, yieldUnit: 'un', totalCost: 120, costPerUnit: 12, ingredients: [], createdAt: user.created_at };
const box = { id: id(4), userId: user.id, name: 'Caixa de bolo', type: 'caixa', unitCost: 2, supplier: null, supplierId: null, photoUrl: null, createdAt: user.created_at };
let history = [{ id: id(5), userId: user.id, productId: product.id, ingredientCost: 10, packagingCost: 1, laborCost: 0, fixedCostShare: 0, totalCost: 11, marginPercent: 50, suggestedPrice: 16.5, finalPrice: 16.5, feesPercent: 0, feesAmount: 0, allocationMode: 'unit', monthlyFixedCosts: null, revenueBasis: null, overheadPercent: 0, channelName: null, sourceSnapshot: { ingredientSource: 'recipe', recipeId: recipe.id, packaging: [{ id: box.id, unitCost: 1 }] }, createdAt: user.created_at }];
const requests = [];
const errors = [];
let failSave = false;
let failApply = false;
const paged = items => ({ items, total: items.length, page: 1, limit: 100, totalPages: 1 });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.addInitScript(({ authKey, token, user }) => {
      localStorage.setItem(authKey, JSON.stringify({ access_token: token, refresh_token: 'fixture', expires_at: 4102444800, expires_in: 3600, token_type: 'bearer', user }));
      localStorage.setItem('onboarding-state', JSON.stringify({ state: { completed: true, completedUserIds: [user.id], pendingUserIds: [], gettingStartedStartedUserIds: [], gettingStartedDismissedUserIds: [user.id], gettingStartedCompletedUserIds: [user.id] }, version: 0 }));
    }, { authKey, token, user });
    await context.route('**/*', async route => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
      const api = url.pathname;
      let body = {};
      if (api.startsWith('/auth/')) body = api.endsWith('/user') ? user : { access_token: token, user };
      else if (api.endsWith('/subscription/profile')) body = profile;
      else if (api.endsWith('/subscription/limits')) body = { currentProducts: 1, currentRecipes: 1, currentSalesThisMonth: 0 };
      else if (api === '/api/v1/products') body = paged([product]);
      else if (api === `/api/v1/products/${product.id}` && req.method() === 'PATCH') {
        const data = req.postDataJSON(); requests.push({ kind: 'apply', data });
        if (failApply) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Falha de teste ao aplicar' }) });
        product.salePrice = data.salePrice; body = product;
      }
      else if (api === '/api/v1/recipes') body = paged([recipe]);
      else if (api === '/api/v1/packaging') body = paged([box]);
      else if (api === '/api/v1/pricing') body = paged(history);
      else if (api === '/api/v1/pricing/calculate-v2') {
        const data = req.postDataJSON(); requests.push({ kind: 'save', data });
        if (failSave) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Falha de teste ao salvar' }) });
        body = { ...history[0], ...data, id: id(6), createdAt: '2026-09-09T12:00:00Z' }; history = [body, ...history];
      }
      else if (api.endsWith('/pricing/preferences')) body = { userId: user.id, channelFees: [{ id: 'card', name: 'Cartão', percent: 10 }], updatedAt: user.created_at };
      else if (api.endsWith('/finance/recurring')) body = [{ id: id(7), userId: user.id, description: 'Energia', amount: 200, active: true, dueDay: 10, category: 'outros' }];
      else if (api.endsWith('/finance/summary')) body = { totalIncome: 1000, totalExpense: 200, balance: 800, period: '2026-08' };
      else if (api.endsWith('/goals/prolabore')) body = { goal: null, progress: { requiredRevenue: 1000 } };
      else if (/low-stock|birthdays|deliveries|overdue/.test(api)) body = [];
      else body = paged([]);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:8083/pricing', { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByText('Quanto cobrar pelo seu produto?', { exact: true }).waitFor({ timeout: 30000 });
    await page.getByRole('button', { name: 'Recalcular Bolo de cenoura', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Recalcular Bolo de cenoura', exact: true }).click();
    assert.equal(await page.getByLabel('Ingredientes / material por unidade', { exact: true }).inputValue(), '12,00');
    assert.equal(await page.getByLabel('Embalagem por unidade', { exact: true }).inputValue(), '2,00');
    await page.getByRole('button', { name: 'Valor em reais', exact: true }).click();
    await page.getByLabel('Ganho desejado por unidade', { exact: true }).fill('600');
    await page.getByRole('button', { name: /Taxas e canal de venda/ }).click();
    await page.getByLabel('Taxas sobre a venda (%)', { exact: true }).fill('10');
    await page.getByText('R$ 22,23', { exact: true }).waitFor();
    await page.getByLabel('Preço que você quer cobrar', { exact: true }).fill('2500');
    await page.getByRole('button', { name: 'Aplicar ao produto', exact: true }).click();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    if (requests.length) throw new Error('Cancelar não deve gravar');
    await page.getByRole('button', { name: 'Aplicar ao produto', exact: true }).click();
    await page.getByRole('button', { name: 'Aplicar preço', exact: true }).click();
    await page.getByText('Preço atualizado', { exact: true }).waitFor();
    if (requests.length !== 2 || requests[0].kind !== 'save' || requests[1].kind !== 'apply' || requests[1].data.salePrice !== 25) throw new Error('Sequência de aplicação incorreta');
    if (requests[0].data.ingredientCost !== 12 || requests[0].data.packagingCost !== 2 || requests[0].data.sourceSnapshot.packaging[0].unitCost !== 2) throw new Error('Custo salvo não é o custo atual');
    console.log('PASS: revisão, importação, ganho, taxa, cancelamento e aplicação com snapshot');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    failSave = true;
    const beforeFailure = requests.length;
    await page.getByRole('button', { name: 'Aplicar ao produto', exact: true }).click();
    await page.getByRole('button', { name: 'Aplicar preço', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).waitFor();
    assert.equal(requests.length, beforeFailure + 1);
    assert.ok(requests.slice(beforeFailure).every(item => item.kind === 'save'));
    assert.equal(requests.at(-1).kind, 'save');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    failSave = false;
    failApply = true;
    await page.getByRole('button', { name: 'Aplicar ao produto', exact: true }).click();
    await page.getByRole('button', { name: 'Aplicar preço', exact: true }).click();
    await page.getByText('O preço não foi atualizado', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    failApply = false;
    console.log('PASS: falha no cálculo impede aplicação; falha na aplicação comunica resultado parcial');
    await page.getByRole('button', { name: /^Seu trabalho/ }).click();
    await page.getByLabel('Trabalho por unidade', { exact: true }).fill('200');
    await page.getByRole('button', { name: /^Despesas do negócio/ }).click();
    await page.getByLabel('Despesas mensais', { exact: true }).fill('20000');
    await page.getByLabel('Produção mensal estimada (unidades)', { exact: true }).fill('100');
    await page.getByText('R$ 26,67', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Por faturamento · Pro', exact: true }).click();
    await page.getByLabel('Faturamento mensal estimado', { exact: true }).fill('100000');
    await page.getByText('R$ 31,43', { exact: true }).waitFor();
    await page.getByLabel('Taxas sobre a venda (%)', { exact: true }).fill('80');
    await page.getByText(/taxas \+ despesas por faturamento devem somar menos/).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Aplicar ao produto', exact: true }).count(), 0);
    await page.getByLabel('Taxas sobre a venda (%)', { exact: true }).fill('10');
    await page.getByText('R$ 31,43', { exact: true }).waitFor();
    console.log('PASS: mão de obra, rateio por unidades/faturamento e limite combinado');
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      if (!(await page.getByLabel('Preço que você quer cobrar', { exact: true }).count())) {
        console.log('Viewport state:', width, (await page.locator('body').innerText()).slice(-3200));
        console.log('Page errors:', errors);
        await page.screenshot({ path: path.join(__dirname, `debug-${width}.png`), fullPage: true });
      }
      assert.equal(await page.getByLabel('Preço que você quer cobrar', { exact: true }).inputValue(), '25,00', `Preço preservado em ${width}`);
      await page.getByText('PREÇO SUGERIDO POR UNIDADE', { exact: true }).scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow em ${width}`);
      await page.screenshot({ path: path.join(__dirname, `pricing-${width}.png`), fullPage: true });
    }
    await page.keyboard.press('Tab');
    assert.notEqual(await page.evaluate(() => document.activeElement.tagName), 'BODY');
    profile.plan = 'free';
    await page.goto('http://localhost:8083/pricing-complete', { waitUntil: 'networkidle' });
    await page.getByText('Quanto cobrar pelo seu produto?', { exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, '/pricing');
    await page.getByRole('button', { name: /^Seu trabalho/ }).click();
    await page.getByLabel('Trabalho por unidade', { exact: true }).fill('200');
    await page.getByRole('button', { name: /^Despesas do negócio/ }).click();
    await page.getByLabel('Despesas mensais', { exact: true }).fill('20000');
    await page.getByLabel('Produção mensal estimada (unidades)', { exact: true }).fill('100');
    await page.getByLabel('Ingredientes / material por unidade', { exact: true }).fill('1000');
    await page.getByLabel('Ganho desejado por unidade', { exact: true }).fill('600');
    await page.getByText('R$ 20,00', { exact: true }).waitFor();
    console.log('PASS: rota antiga redireciona; trabalho e rateio por produção disponíveis no plano gratuito; cinco larguras sem overflow');
    await page.screenshot({ path: path.join(__dirname, 'desktop-initial.png'), fullPage: true });
    fs.writeFileSync(path.join(__dirname, 'browser-results.json'), JSON.stringify({ errors, requests }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
