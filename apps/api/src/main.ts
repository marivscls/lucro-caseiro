import cors from "cors";
import express, { type Express } from "express";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { config } from "./config";
import { createAccountRouter } from "./features/account/account.routes";
import { AccountRepoPg } from "./features/account/account.repo.pg";
import { AccountUseCases } from "./features/account/account.usecases";
import { createAnalyticsRouter } from "./features/analytics/analytics.routes";
import { AnalyticsRepoPg } from "./features/analytics/analytics.repo.pg";
import { AnalyticsUseCases } from "./features/analytics/analytics.usecases";
import {
  createCatalogRouter,
  createPublicCatalogRouter,
} from "./features/catalog/catalog.routes";
import { CatalogRepoPg } from "./features/catalog/catalog.repo.pg";
import { CatalogUseCases } from "./features/catalog/catalog.usecases";
import { createClientsRouter } from "./features/clients/clients.routes";
import { ClientsRepoPg } from "./features/clients/clients.repo.pg";
import { ClientsUseCases } from "./features/clients/clients.usecases";
import { createSuppliersRouter } from "./features/suppliers/suppliers.routes";
import { SuppliersRepoPg } from "./features/suppliers/suppliers.repo.pg";
import { SuppliersUseCases } from "./features/suppliers/suppliers.usecases";
import { createPurchasesRouter } from "./features/purchases/purchases.routes";
import { PurchasesRepoPg } from "./features/purchases/purchases.repo.pg";
import { PurchasesUseCases } from "./features/purchases/purchases.usecases";
import { createFinanceRouter } from "./features/finance/finance.routes";
import { FinanceRepoPg } from "./features/finance/finance.repo.pg";
import { FinanceUseCases } from "./features/finance/finance.usecases";
import { createGoalsRouter } from "./features/goals/goals.routes";
import { GoalsRepoPg } from "./features/goals/goals.repo.pg";
import { GoalsUseCases } from "./features/goals/goals.usecases";
import { createOrdersRouter } from "./features/orders/orders.routes";
import { OrdersRepoPg } from "./features/orders/orders.repo.pg";
import { OrdersUseCases } from "./features/orders/orders.usecases";
import { createMaterialsRouter } from "./features/materials/materials.routes";
import { MaterialsRepoPg } from "./features/materials/materials.repo.pg";
import { MaterialsUseCases } from "./features/materials/materials.usecases";
import { createInsightsRouter } from "./features/insights/insights.routes";
import { InsightsRepoPg } from "./features/insights/insights.repo.pg";
import { InsightsUseCases } from "./features/insights/insights.usecases";
import { createLabelsRouter } from "./features/labels/labels.routes";
import { LabelsRepoPg } from "./features/labels/labels.repo.pg";
import { LabelsUseCases } from "./features/labels/labels.usecases";
import { createPackagingRouter } from "./features/packaging/packaging.routes";
import { PackagingRepoPg } from "./features/packaging/packaging.repo.pg";
import { PackagingUseCases } from "./features/packaging/packaging.usecases";
import { createPricingRouter } from "./features/pricing/pricing.routes";
import { PricingRepoPg } from "./features/pricing/pricing.repo.pg";
import { PricingUseCases } from "./features/pricing/pricing.usecases";
import { createProductsRouter } from "./features/products/products.routes";
import { CosmosProductCatalog } from "./features/products/products.catalog";
import { ProductsRepoPg } from "./features/products/products.repo.pg";
import { ProductsUseCases } from "./features/products/products.usecases";
import { createProductionRouter } from "./features/production/production.routes";
import { ProductionRepoPg } from "./features/production/production.repo.pg";
import { ProductionUseCases } from "./features/production/production.usecases";
import { createIngredientsRouter } from "./features/recipes/ingredients.routes";
import { IngredientsRepoPg } from "./features/recipes/ingredients.repo.pg";
import { IngredientsUseCases } from "./features/recipes/ingredients.usecases";
import { createQuotesRouter } from "./features/quotes/quotes.routes";
import { QuotesRepoPg } from "./features/quotes/quotes.repo.pg";
import { QuotesUseCases } from "./features/quotes/quotes.usecases";
import { createRecipesRouter } from "./features/recipes/recipes.routes";
import { RecipesRepoPg } from "./features/recipes/recipes.repo.pg";
import { RecipesUseCases } from "./features/recipes/recipes.usecases";
import { createSalesRouter } from "./features/sales/sales.routes";
import { SalesRepoPg } from "./features/sales/sales.repo.pg";
import { SalesUseCases } from "./features/sales/sales.usecases";
import { createSubscriptionRouter } from "./features/subscription/subscription.routes";
import { SubscriptionRepoPg } from "./features/subscription/subscription.repo.pg";
import { SubscriptionUseCases } from "./features/subscription/subscription.usecases";
import { GooglePlayClient } from "./features/subscription/google-play.client";
import {
  createStripeCheckoutRouter,
  createStripeWebhookRouter,
} from "./features/payments/stripe.routes";
import { StripeUseCases } from "./features/payments/stripe.usecases";
import { ServiceUnavailableError } from "./shared/errors";
import type { PlanFeature } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "./features/subscription/subscription.domain";
import { errorHandler } from "./shared/middleware/error-handler";
import { freemiumGuard } from "./shared/middleware/freemium-guard";
import {
  requireFeature,
  requireFeatureForComposite,
  requireFeatureForExtraPhotos,
} from "./shared/middleware/require-feature";
import { rateLimit } from "./shared/middleware/rate-limit";
import {
  createPostgresRateLimitStore,
  postgresRateLimit,
} from "./shared/middleware/postgres-rate-limit";
import { securityHeaders } from "./shared/middleware/security-headers";
import { isAllowedCorsOrigin } from "./shared/middleware/cors";
import { healthRouter } from "./shared/health";
import { setDb } from "./shared/db";
import { createClient } from "@lucro-caseiro/database";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createMarketingRouter } from "./features/marketing/marketing.routes";
import {
  generateMarketingAiWithFallback,
  MarketingAiQuotaError,
} from "./features/marketing/marketing-ai.provider";
import { MarketingRepoPg } from "./features/marketing/marketing.repo.pg";
import {
  MarketingUseCases,
  type MarketingAiGenerator,
} from "./features/marketing/marketing.usecases";
import { VideoPromptRepoPg } from "./features/marketing/video-prompt.repo.pg";
import { VideoPromptUseCases } from "./features/marketing/video-prompt.usecases";
import { OpenAiVideoEditor } from "./features/marketing/openai-video-editor";
import { VideoEditorProcessor } from "./features/marketing/video-editor.processor";
import { VideoEditorRepoPg } from "./features/marketing/video-editor.repo.pg";
import { VideoEditorUseCases } from "./features/marketing/video-editor.usecases";
import { createExpoPushSender } from "./features/notifications/expo-push";
import { createNotificationsRouter } from "./features/notifications/notifications.routes";
import { NotificationsRepoPg } from "./features/notifications/notifications.repo.pg";
import { NotificationsUseCases } from "./features/notifications/notifications.usecases";
import {
  createPromotionsRouter,
  createPublicRetailRouter,
  createRetailRouter,
} from "./features/retail/retail.routes";
import { RetailRepoPg } from "./features/retail/retail.repo.pg";
import { RetailUseCases } from "./features/retail/retail.usecases";
import { createVerticalsRouter } from "./features/verticals/verticals.routes";
import { VerticalsRepoPg } from "./features/verticals/verticals.repo.pg";
import { VerticalsUseCases } from "./features/verticals/verticals.usecases";
import { createResendEmailSender } from "./features/email/resend-email";
import { buildProfessionalTrialEmail } from "./features/email/professional-trial-email";
import { createSubscriptionEmailNotifier } from "./features/email/subscription-lifecycle-email";

// Database
const db = createClient(config.databaseUrl);
setDb(db);

// Repos
const productsRepo = new ProductsRepoPg(db);
const clientsRepo = new ClientsRepoPg(db);
const suppliersRepo = new SuppliersRepoPg(db);
const purchasesRepo = new PurchasesRepoPg(db);
const salesRepo = new SalesRepoPg(db);
const financeRepo = new FinanceRepoPg(db);
const recipesRepo = new RecipesRepoPg(db);
const ingredientsRepo = new IngredientsRepoPg(db);
const labelsRepo = new LabelsRepoPg(db);
const packagingRepo = new PackagingRepoPg(db);
const pricingRepo = new PricingRepoPg(db);
const subscriptionRepo = new SubscriptionRepoPg(db);
const goalsRepo = new GoalsRepoPg(db);
const ordersRepo = new OrdersRepoPg(db);
const materialsRepo = new MaterialsRepoPg(db);
const insightsRepo = new InsightsRepoPg(db);
const productionUseCases = new ProductionUseCases(new ProductionRepoPg(db));
const verticalsUseCases = new VerticalsUseCases(new VerticalsRepoPg(db));
const googlePlayClient = new GooglePlayClient(
  config.googlePlayPackageName,
  config.googlePlayServiceAccountJson,
);

// Use Cases
const recipesUseCases = new RecipesUseCases(recipesRepo);
const productsUseCases = new ProductsUseCases(
  productsRepo,
  {
    // Custo real do produto = custo por unidade da receita (insumos).
    getCostPerUnit: async (userId, recipeId) => {
      try {
        const recipe = await recipesUseCases.getById(userId, recipeId);
        return recipe.costPerUnit;
      } catch {
        return null;
      }
    },
  },
  new CosmosProductCatalog(config.cosmosApiToken, config.cosmosUserAgent),
);
const clientsUseCases = new ClientsUseCases(clientsRepo);
const suppliersUseCases = new SuppliersUseCases(suppliersRepo);
const materialsUseCases = new MaterialsUseCases(materialsRepo);
const financeUseCases = new FinanceUseCases(financeRepo);
const salesUseCases = new SalesUseCases(
  salesRepo,
  productsRepo,
  {
    // Linhas de insumo da receita (materialId + quantidade) para dar baixa na venda.
    getRecipeLines: async (userId, recipeId) => {
      try {
        const recipe = await recipesUseCases.getById(userId, recipeId);
        return recipe.ingredients.map((line) => ({
          materialId: line.materialId,
          quantity: line.quantity,
        }));
      } catch {
        return [];
      }
    },
  },
  {
    adjustStock: async (userId, materialId, delta) => {
      await materialsUseCases.adjust(userId, materialId, delta);
    },
  },
  // Venda paga → entrada automática no caixa (idempotente por saleId).
  financeUseCases,
);
const retailUseCases = new RetailUseCases(
  new RetailRepoPg(db),
  productsRepo,
  salesUseCases,
  clientsRepo,
);
// Exclusao de conta: usa um client Supabase com service-role key para remover
// o usuario do Auth. A key e opcional no boot; se ausente, deleteAuthUser lanca
// ServiceUnavailableError (503) em vez de derrubar o servidor.
const supabaseAdmin = config.supabaseServiceRoleKey
  ? createSupabaseClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
const accountRepo = new AccountRepoPg(db);
const accountUseCases = new AccountUseCases(accountRepo, {
  deleteAuthUser: async (userId: string) => {
    if (!supabaseAdmin) {
      throw new ServiceUnavailableError(
        "Exclusão de conta indisponível no momento. Tente novamente mais tarde.",
      );
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      throw new ServiceUnavailableError(
        "Não foi possível excluir a conta agora. Tente novamente mais tarde.",
      );
    }
  },
});
const analyticsUseCases = new AnalyticsUseCases(new AnalyticsRepoPg(db));
const emailSender = config.resendApiKey
  ? createResendEmailSender(config.resendApiKey, config.emailFrom)
  : undefined;
const subscriptionEmailNotifier = emailSender
  ? createSubscriptionEmailNotifier(emailSender, config.emailReplyTo || undefined)
  : undefined;
const professionalTrialCampaignEmail = buildProfessionalTrialEmail();
const professionalTrialCampaignNotifier = emailSender
  ? (event: { email: string; idempotencyKey: string }) =>
      emailSender({
        to: event.email,
        ...professionalTrialCampaignEmail,
        idempotencyKey: event.idempotencyKey,
        ...(config.emailReplyTo ? { replyTo: config.emailReplyTo } : {}),
      })
  : undefined;
const marketingAi = config.googleGenerativeAiApiKey
  ? createGoogleGenerativeAI({ apiKey: config.googleGenerativeAiApiKey })
  : null;
const marketingRepo = new MarketingRepoPg(db);
const marketingGenerate: MarketingAiGenerator | undefined = marketingAi
  ? async ({ system, prompt }) => {
      try {
        return await generateMarketingAiWithFallback(async (model, abortSignal) => {
          const result = await generateText({
            model: marketingAi(model),
            system,
            prompt,
            abortSignal,
            maxRetries: 0,
          });
          return result.text;
        });
      } catch (error) {
        console.error("Marketing AI generation failed:", error);
        throw new ServiceUnavailableError(
          error instanceof MarketingAiQuotaError
            ? "O limite de uso da IA foi atingido. Tente novamente mais tarde."
            : "A IA est\u00e1 temporariamente indispon\u00edvel. Tente novamente em instantes.",
        );
      }
    }
  : undefined;
const marketingUseCases = new MarketingUseCases(marketingRepo, marketingGenerate);
const videoPromptUseCases = new VideoPromptUseCases(
  new VideoPromptRepoPg(db),
  marketingRepo,
  marketingGenerate,
);
const videoEditorRepo = new VideoEditorRepoPg(db);
const openAiVideoEditor = config.openAiApiKey
  ? new OpenAiVideoEditor(config.openAiApiKey)
  : undefined;
const videoEditorProcessor =
  supabaseAdmin && openAiVideoEditor
    ? new VideoEditorProcessor(
        videoEditorRepo,
        supabaseAdmin,
        openAiVideoEditor,
        config.videoEditorFfmpegPath,
        config.videoEditorFfprobePath,
      )
    : undefined;
const videoEditorUseCases = new VideoEditorUseCases(
  videoEditorRepo,
  supabaseAdmin ?? undefined,
  videoEditorProcessor,
);

if (videoEditorProcessor)
  void videoEditorProcessor
    .recover()
    .then((count) => {
      if (count) console.warn(`Retomando ${count} edição(ões) de vídeo interrompida(s).`);
    })
    .catch((error) => console.error("Falha ao retomar edições de vídeo:", error));

const notificationsUseCases = new NotificationsUseCases(
  new NotificationsRepoPg(db),
  createExpoPushSender(),
);
const catalogUseCases = new CatalogUseCases(new CatalogRepoPg(db), (...args) =>
  notificationsUseCases.notifyServiceBooking(...args),
);
// Conversao orcamento -> encomenda reusa o usecase de orders (injetado adiante).

const purchasesUseCases = new PurchasesUseCases(
  purchasesRepo,
  financeUseCases,
  productsRepo,
);
const ingredientsUseCases = new IngredientsUseCases(ingredientsRepo);
// Gate de plano por feature (usado onde o gate vive no usecase, não em middleware).
const userHasFeature =
  (feature: PlanFeature) =>
  async (userId: string): Promise<boolean> => {
    const profile = await subscriptionRepo.getProfile(userId);
    return !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, feature);
  };
const labelsUseCases = new LabelsUseCases(labelsRepo, userHasFeature("labelsPremium"));
const packagingUseCases = new PackagingUseCases(packagingRepo);
const pricingUseCases = new PricingUseCases(pricingRepo);
const subscriptionUseCases = new SubscriptionUseCases(
  subscriptionRepo,
  googlePlayClient,
  (userId, action) => analyticsUseCases.recordUserAction(userId, action),
  subscriptionEmailNotifier,
  professionalTrialCampaignNotifier,
);
const goalsUseCases = new GoalsUseCases(
  goalsRepo,
  financeUseCases,
  salesUseCases,
  productsUseCases,
);
const ordersUseCases = new OrdersUseCases(ordersRepo, financeUseCases, salesUseCases);
const insightsUseCases = new InsightsUseCases(insightsRepo);

// Payments (Stripe)
const stripeClient = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;
const stripeUseCases = new StripeUseCases(stripeClient, subscriptionUseCases, {
  prices: config.stripePrices,
  successUrl: config.stripeSuccessUrl,
  cancelUrl: config.stripeCancelUrl,
});

// App
const app: Express = express();
app.disable("x-powered-by");
// Railway fica atrás de 1 proxy → req.ip vira o IP real do cliente (essencial p/ rate limit).
app.set("trust proxy", 1);

app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, isAllowedCorsOrigin(origin, config.corsOrigins));
    },
  }),
);
app.use(
  "/api/v1/webhooks",
  createStripeWebhookRouter(stripeUseCases, {
    stripe: stripeClient,
    webhookSecret: config.stripeWebhookSecret,
  }),
);
// Barreira contra abuso/rajada (webhook do Stripe fica de fora, montado antes).
app.use(rateLimit({ windowMs: 60_000, max: 300 }));

const sharedRateLimitStore = createPostgresRateLimitStore(db);
const publicWriteLimit = postgresRateLimit({
  store: sharedRateLimitStore,
  scope: "public-write",
  windowMs: 10 * 60_000,
  max: 20,
});
const billingLimit = postgresRateLimit({
  store: sharedRateLimitStore,
  scope: "billing",
  windowMs: 10 * 60_000,
  max: 10,
});
const expensiveLimit = postgresRateLimit({
  store: sharedRateLimitStore,
  scope: "expensive",
  windowMs: 10 * 60_000,
  max: 30,
});
const analyticsWriteLimit = postgresRateLimit({
  store: sharedRateLimitStore,
  scope: "analytics-write",
  windowMs: 60_000,
  max: 120,
});

app.use("/c/:slug/service-bookings", publicWriteLimit);
app.use("/api/v1/public/retail/catalog-orders", publicWriteLimit);
app.use(["/api/v1/analytics/open", "/api/v1/analytics/events"], analyticsWriteLimit);
app.use(
  ["/api/v1/payments/stripe/checkout", "/api/v1/subscription/sync-plan"],
  billingLimit,
);
app.use("/api/v1/marketing/ai", expensiveLimit);
app.use(express.json({ limit: "256kb" }));

// Structured request log for multi-brand operation (ADR-0009).
app.use((req, res, next) => {
  const brand = req.header("x-brand")?.trim() || "lucro-caseiro";
  res.on("finish", () => {
    // Request logs are the operational metric for brand-separated API traffic.
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        event: "api_request",
        brand,
        method: req.method,
        path: req.path,
        status: res.statusCode,
      }),
    );
  });
  next();
});

// Health check
app.use("/api/v1/health", healthRouter);

// Feature routes
app.use("/api/v1/account", createAccountRouter(accountUseCases));
app.use(
  "/api/v1/analytics",
  createAnalyticsRouter(analyticsUseCases, config.adminUserIds),
);
app.use(
  "/api/v1/marketing",
  createMarketingRouter(marketingUseCases, videoPromptUseCases, videoEditorUseCases),
);
app.use("/api/v1/notifications", createNotificationsRouter(notificationsUseCases));
app.use(
  "/api/v1/products",
  createProductsRouter(
    productsUseCases,
    freemiumGuard(subscriptionRepo, "products"),
    requireFeatureForExtraPhotos(subscriptionRepo),
    requireFeatureForComposite(subscriptionRepo),
  ),
);
app.use(
  "/api/v1/clients",
  createClientsRouter(clientsUseCases, freemiumGuard(subscriptionRepo, "clients")),
);
app.use(
  "/api/v1/suppliers",
  createSuppliersRouter(suppliersUseCases, freemiumGuard(subscriptionRepo, "suppliers")),
);
app.use(
  "/api/v1/purchases",
  createPurchasesRouter(purchasesUseCases, requireFeature(subscriptionRepo, "purchases")),
);
app.use(
  "/api/v1/sales",
  createSalesRouter(salesUseCases, freemiumGuard(subscriptionRepo, "sales")),
);
app.use(
  "/api/v1/finance",
  createFinanceRouter(
    financeUseCases,
    requireFeature(subscriptionRepo, "exportBasic"),
    requireFeature(subscriptionRepo, "export"),
    requireFeature(subscriptionRepo, "recurringExpenses"),
  ),
);
app.use("/api/v1/goals", createGoalsRouter(goalsUseCases));
app.use("/api/v1/orders", createOrdersRouter(ordersUseCases));
app.use("/api/v1/production", createProductionRouter(productionUseCases));
app.use("/api/v1/materials", createMaterialsRouter(materialsUseCases));
app.use(
  "/api/v1/insights",
  createInsightsRouter(insightsUseCases, userHasFeature("advancedReports")),
);
app.use(
  "/api/v1/recipes",
  createRecipesRouter(recipesUseCases, freemiumGuard(subscriptionRepo, "recipes")),
);
app.use("/api/v1/ingredients", createIngredientsRouter(ingredientsUseCases));
app.use(
  "/api/v1/pricing",
  createPricingRouter(
    pricingUseCases,
    requireFeature(subscriptionRepo, "advancedPricing"),
  ),
);
app.use("/api/v1/labels", createLabelsRouter(labelsUseCases));
app.use(
  "/api/v1/packaging",
  createPackagingRouter(packagingUseCases, freemiumGuard(subscriptionRepo, "packaging")),
);
app.use(
  "/api/v1/quotes",
  createQuotesRouter(new QuotesUseCases(new QuotesRepoPg(db), ordersUseCases)),
);
app.use("/api/v1/catalog", createCatalogRouter(catalogUseCases));
app.use("/api/v1/retail", createRetailRouter(retailUseCases));
app.use("/api/v1/verticals", createVerticalsRouter(verticalsUseCases));
app.use("/api/v1/promotions", createPromotionsRouter(retailUseCases));
app.use(
  "/api/v1/public/retail",
  createPublicRetailRouter(retailUseCases, catalogUseCases),
);
// Catalogo publico (sem auth): pagina HTML compartilhavel em /c/:slug.
app.use("/c", createPublicCatalogRouter(catalogUseCases));
app.use("/api/v1/subscription", createSubscriptionRouter(subscriptionUseCases));
app.use("/api/v1/payments/stripe", createStripeCheckoutRouter(stripeUseCases));

app.use(errorHandler);

app.listen(config.port, () => {
  console.warn(`Lucro Caseiro API running on port ${config.port}`);
});

export { app };
