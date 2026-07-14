-- Analytics comportamental com nomes fechados; nunca armazena metadata ou conteúdo do usuário.

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  installation_id UUID NOT NULL REFERENCES analytics_installations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('screen_view', 'action')),
  event_name TEXT NOT NULL,
  CHECK (
    (event_type = 'screen_view' AND event_name IN (
      'login', 'register', 'auth_callback', 'reset_password', 'onboarding',
      'home', 'sales', 'new_sale', 'agenda', 'clients', 'more', 'admin_metrics',
      'catalog', 'fiado', 'finance', 'insights', 'labels', 'materials', 'packaging',
      'plans', 'pricing', 'products', 'purchases', 'quotes', 'recipes',
      'recurring_expenses', 'settings', 'suppliers', 'support'
    ))
    OR
    (event_type = 'action' AND event_name IN (
      'signup_completed', 'pricing_completed', 'product_created', 'sale_completed',
      'order_created', 'catalog_shared', 'quote_created', 'quote_pdf_exported',
      'finance_entry_created', 'subscription_started'
    ))
  ),
  duration_ms INTEGER CHECK (
    (event_type = 'screen_view' AND duration_ms BETWEEN 250 AND 21600000)
    OR (event_type = 'action' AND duration_ms IS NULL)
  ),
  app_version TEXT NOT NULL CHECK (char_length(app_version) BETWEEN 1 AND 32),
  app_build TEXT CHECK (app_build IS NULL OR char_length(app_build) BETWEEN 1 AND 32),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred
  ON analytics_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_name_occurred
  ON analytics_events(event_type, event_name, occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_installation
  ON analytics_events(installation_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user
  ON analytics_events(user_id);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON analytics_events FROM anon, authenticated;
REVOKE ALL ON SEQUENCE analytics_events_id_seq FROM anon, authenticated;
