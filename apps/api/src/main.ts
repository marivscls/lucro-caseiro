import cors from "cors";
import express, { type Express } from "express";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { config } from "./config";
import { createAccountRouter } from "./features/account/account.routes";
import { AccountRepoPg } from "./features/account/account.repo.pg";
import { AccountUseCases } from "./features/account/account.usecases";
import {
  createCatalogRouter,
  createPublicCatalogRouter,
} from "./features/catalog/catalog.routes";
import { CatalogRepoPg } from "./features/catalog/catalog.repo.pg";
import { CatalogUseCases } from "./features/catalog/catalog.usecases";
import { createClientsRouter } from "./features/clients/clients.routes";
import { ClientsRepoPg } from "./features/clients/clients.repo.pg";
import { ClientsUseCases } from "./features/clients/clients.usecases";
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
import { ProductsRepoPg } from "./features/products/products.repo.pg";
import { ProductsUseCases } from "./features/products/products.usecases";
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
import { isPremiumActive } from "./features/subscription/subscription.domain";
import { errorHandler } from "./shared/middleware/error-handler";
import { freemiumGuard } from "./shared/middleware/freemium-guard";
import { healthRouter } from "./shared/health";
import { setDb } from "./shared/db";
import { createClient } from "@lucro-caseiro/database";

// Database
const db = createClient(config.databaseUrl);
setDb(db);

// Repos
const productsRepo = new ProductsRepoPg(db);
const clientsRepo = new ClientsRepoPg(db);
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
const googlePlayClient = new GooglePlayClient(
  config.googlePlayPackageName,
  config.googlePlayServiceAccountJson,
);

// Use Cases
const recipesUseCases = new RecipesUseCases(recipesRepo);
const productsUseCases = new ProductsUseCases(productsRepo, {
  // Custo real do produto = custo por unidade da receita (insumos).
  getCostPerUnit: async (userId, recipeId) => {
    try {
      const recipe = await recipesUseCases.getById(userId, recipeId);
      return recipe.costPerUnit;
    } catch {
      return null;
    }
  },
});
const clientsUseCases = new ClientsUseCases(clientsRepo);
const materialsUseCases = new MaterialsUseCases(materialsRepo);
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

const catalogUseCases = new CatalogUseCases(new CatalogRepoPg(db));
// Conversao orcamento -> encomenda reusa o usecase de orders (injetado adiante).

const financeUseCases = new FinanceUseCases(financeRepo);
const ingredientsUseCases = new IngredientsUseCases(ingredientsRepo);
const labelsUseCases = new LabelsUseCases(labelsRepo, async (userId) => {
  const profile = await subscriptionRepo.getProfile(userId);
  return !!profile && isPremiumActive(profile.plan, profile.planExpiresAt);
});
const packagingUseCases = new PackagingUseCases(packagingRepo);
const pricingUseCases = new PricingUseCases(pricingRepo);
const subscriptionUseCases = new SubscriptionUseCases(subscriptionRepo, googlePlayClient);
const goalsUseCases = new GoalsUseCases(
  goalsRepo,
  financeUseCases,
  salesUseCases,
  productsUseCases,
);
const ordersUseCases = new OrdersUseCases(ordersRepo, financeUseCases);
const insightsUseCases = new InsightsUseCases(insightsRepo);

// Payments (Stripe)
const stripeClient = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;
const stripeUseCases = new StripeUseCases(stripeClient, subscriptionUseCases, {
  monthlyPriceId: config.stripePriceMonthlyId,
  annualPriceId: config.stripePriceAnnualId,
  successUrl: config.stripeSuccessUrl,
  cancelUrl: config.stripeCancelUrl,
});

// App
const app: Express = express();
app.disable("x-powered-by");

app.use(cors({ origin: config.corsOrigin }));
app.use(
  "/api/v1/webhooks",
  createStripeWebhookRouter(stripeUseCases, {
    stripe: stripeClient,
    webhookSecret: config.stripeWebhookSecret,
  }),
);
app.use(express.json());

// Health check
app.use("/api/v1/health", healthRouter);

// Feature routes
app.use("/api/v1/account", createAccountRouter(accountUseCases));
app.use(
  "/api/v1/products",
  createProductsRouter(productsUseCases, freemiumGuard(subscriptionRepo, "products")),
);
app.use(
  "/api/v1/clients",
  createClientsRouter(clientsUseCases, freemiumGuard(subscriptionRepo, "clients")),
);
// Vendas ilimitadas no free — sem guard (registrar venda é a ação central diária).
app.use("/api/v1/sales", createSalesRouter(salesUseCases));
app.use("/api/v1/finance", createFinanceRouter(financeUseCases));
app.use("/api/v1/goals", createGoalsRouter(goalsUseCases));
app.use("/api/v1/orders", createOrdersRouter(ordersUseCases));
app.use("/api/v1/materials", createMaterialsRouter(materialsUseCases));
app.use("/api/v1/insights", createInsightsRouter(insightsUseCases));
app.use(
  "/api/v1/recipes",
  createRecipesRouter(recipesUseCases, freemiumGuard(subscriptionRepo, "recipes")),
);
app.use("/api/v1/ingredients", createIngredientsRouter(ingredientsUseCases));
app.use("/api/v1/pricing", createPricingRouter(pricingUseCases));
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
// Catalogo publico (sem auth): pagina HTML compartilhavel em /c/:slug.
app.use("/c", createPublicCatalogRouter(catalogUseCases));
app.use("/api/v1/subscription", createSubscriptionRouter(subscriptionUseCases));
app.use("/api/v1/payments/stripe", createStripeCheckoutRouter(stripeUseCases));

app.use(errorHandler);

app.listen(config.port, () => {
  console.warn(`Lucro Caseiro API running on port ${config.port}`);
});

export { app };
