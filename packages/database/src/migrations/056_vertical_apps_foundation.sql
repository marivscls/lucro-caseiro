CREATE TABLE IF NOT EXISTS "app_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "brand_id" text NOT NULL,
  "domain" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "onboarded_at" timestamptz,
  "last_opened_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_app_memberships_user_brand"
  ON "app_memberships" ("user_id", "brand_id");
CREATE INDEX IF NOT EXISTS "idx_app_memberships_user_status"
  ON "app_memberships" ("user_id", "status");

CREATE TABLE IF NOT EXISTS "vertical_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "domain" text NOT NULL,
  "kind" text NOT NULL,
  "status" text NOT NULL,
  "title" text NOT NULL,
  "client_id" uuid REFERENCES "clients"("id") ON DELETE SET NULL,
  "parent_id" uuid,
  "amount" numeric(14,2) NOT NULL DEFAULT 0,
  "cost" numeric(14,2) NOT NULL DEFAULT 0,
  "progress" numeric(7,3) NOT NULL DEFAULT 0,
  "starts_at" timestamptz,
  "due_at" timestamptz,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "version" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_vertical_documents_user_domain_kind"
  ON "vertical_documents" ("user_id", "domain", "kind");
CREATE INDEX IF NOT EXISTS "idx_vertical_documents_user_domain_status"
  ON "vertical_documents" ("user_id", "domain", "status");
CREATE INDEX IF NOT EXISTS "idx_vertical_documents_due_at"
  ON "vertical_documents" ("user_id", "domain", "due_at");

CREATE TABLE IF NOT EXISTS "vertical_document_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id" uuid NOT NULL REFERENCES "vertical_documents"("id") ON DELETE CASCADE,
  "product_id" uuid REFERENCES "products"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "category" text,
  "quantity" numeric(14,3) NOT NULL DEFAULT 1,
  "unit" text NOT NULL DEFAULT 'un',
  "unit_cost" numeric(14,4) NOT NULL DEFAULT 0,
  "unit_price" numeric(14,2) NOT NULL DEFAULT 0,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS "idx_vertical_document_items_document"
  ON "vertical_document_items" ("document_id");
CREATE INDEX IF NOT EXISTS "idx_vertical_document_items_product"
  ON "vertical_document_items" ("product_id");

CREATE TABLE IF NOT EXISTS "vertical_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "document_id" uuid NOT NULL REFERENCES "vertical_documents"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "from_status" text,
  "to_status" text,
  "idempotency_key" text,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_vertical_events_document"
  ON "vertical_events" ("document_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_vertical_events_user_idempotency"
  ON "vertical_events" ("user_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "vertical_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "domain" text NOT NULL,
  "client_id" uuid REFERENCES "clients"("id") ON DELETE SET NULL,
  "kind" text NOT NULL,
  "name" text NOT NULL,
  "identifier" text,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_vertical_assets_user_domain"
  ON "vertical_assets" ("user_id", "domain");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_vertical_assets_identifier"
  ON "vertical_assets" ("user_id", "domain", "identifier")
  WHERE "identifier" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "resale_serials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "variation_id" uuid,
  "serial" text NOT NULL,
  "status" text NOT NULL DEFAULT 'available',
  "lot_document_id" uuid REFERENCES "vertical_documents"("id") ON DELETE SET NULL,
  "sale_id" uuid,
  "cost" numeric(14,2) NOT NULL DEFAULT 0,
  "sold_at" timestamptz,
  "warranty_until" timestamptz,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_resale_serials_user_serial"
  ON "resale_serials" ("user_id", "serial");
CREATE INDEX IF NOT EXISTS "idx_resale_serials_product_status"
  ON "resale_serials" ("user_id", "product_id", "status");

-- A API acessa estas tabelas pelo papel interno do servidor. Clientes Supabase
-- não recebem acesso direto: toda autorização continua centralizada no backend.
ALTER TABLE "app_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_document_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resale_serials" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON
  "app_memberships",
  "vertical_documents",
  "vertical_document_items",
  "vertical_events",
  "vertical_assets",
  "resale_serials"
FROM anon, authenticated;
