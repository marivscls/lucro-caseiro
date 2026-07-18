-- Completa os marcos do funil de ativacao e do ciclo de assinatura.
-- Os nomes continuam fechados no banco: clientes nao podem inventar eventos.

ALTER TABLE analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_check;

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_event_name_check CHECK (
    (event_type = 'screen_view' AND event_name IN (
      'login', 'register', 'auth_callback', 'reset_password', 'onboarding',
      'home', 'sales', 'new_sale', 'agenda', 'clients', 'more', 'admin_metrics',
      'catalog', 'fiado', 'finance', 'insights', 'labels', 'materials', 'packaging',
      'plans', 'pricing', 'products', 'purchases', 'quotes', 'recipes',
      'recurring_expenses', 'settings', 'suppliers', 'support'
    ))
    OR
    (event_type = 'action' AND event_name IN (
      'signup_completed', 'pricing_started', 'pricing_completed', 'product_created',
      'product_created_from_pricing', 'sale_completed', 'order_created',
      'catalog_published', 'catalog_shared', 'quote_created', 'quote_pdf_exported',
      'finance_entry_created', 'plan_limit_reached', 'paid_feature_requested',
      'subscription_started', 'subscription_completed', 'subscription_cancelled'
    ))
  );
