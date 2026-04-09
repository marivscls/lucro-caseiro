import cors from "cors";
import express, { type Express } from "express";

import { config } from "./config";
import { createClientsRouter } from "./features/clients/clients.routes";
import { ClientsRepoPg } from "./features/clients/clients.repo.pg";
import { ClientsUseCases } from "./features/clients/clients.usecases";
import { createFinanceRouter } from "./features/finance/finance.routes";
import { FinanceRepoPg } from "./features/finance/finance.repo.pg";
import { FinanceUseCases } from "./features/finance/finance.usecases";
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
import { createRecipesRouter } from "./features/recipes/recipes.routes";
import { RecipesRepoPg } from "./features/recipes/recipes.repo.pg";
import { RecipesUseCases } from "./features/recipes/recipes.usecases";
import { createSalesRouter } from "./features/sales/sales.routes";
import { SalesRepoPg } from "./features/sales/sales.repo.pg";
import { SalesUseCases } from "./features/sales/sales.usecases";
import { createSubscriptionRouter } from "./features/subscription/subscription.routes";
import { SubscriptionRepoPg } from "./features/subscription/subscription.repo.pg";
import { SubscriptionUseCases } from "./features/subscription/subscription.usecases";
import { errorHandler } from "./shared/middleware/error-handler";
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

// Use Cases
const productsUseCases = new ProductsUseCases(productsRepo);
const clientsUseCases = new ClientsUseCases(clientsRepo);
const salesUseCases = new SalesUseCases(salesRepo, productsRepo);
const financeUseCases = new FinanceUseCases(financeRepo);
const recipesUseCases = new RecipesUseCases(recipesRepo);
const ingredientsUseCases = new IngredientsUseCases(ingredientsRepo);
const labelsUseCases = new LabelsUseCases(labelsRepo);
const packagingUseCases = new PackagingUseCases(packagingRepo);
const pricingUseCases = new PricingUseCases(pricingRepo);
const subscriptionUseCases = new SubscriptionUseCases(subscriptionRepo);

// App
const app: Express = express();
app.disable("x-powered-by");

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Health check
app.use("/api/v1/health", healthRouter);

// Feature routes
app.use("/api/v1/products", createProductsRouter(productsUseCases));
app.use("/api/v1/clients", createClientsRouter(clientsUseCases));
app.use("/api/v1/sales", createSalesRouter(salesUseCases));
app.use("/api/v1/finance", createFinanceRouter(financeUseCases));
app.use("/api/v1/recipes", createRecipesRouter(recipesUseCases));
app.use("/api/v1/ingredients", createIngredientsRouter(ingredientsUseCases));
app.use("/api/v1/pricing", createPricingRouter(pricingUseCases));
app.use("/api/v1/labels", createLabelsRouter(labelsUseCases));
app.use("/api/v1/packaging", createPackagingRouter(packagingUseCases));
app.use("/api/v1/subscription", createSubscriptionRouter(subscriptionUseCases));

app.use(errorHandler);

app.listen(config.port, () => {
  console.warn(`Lucro Caseiro API running on port ${config.port}`);
});

export { app };
