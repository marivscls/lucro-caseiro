-- Funil mínimo de produto: instalação observada, atividade diária e vínculo com usuário.
-- Ativação é derivada das tabelas canônicas (pricing_calculations, sales e orders).

CREATE TABLE IF NOT EXISTS analytics_installations (
  id UUID PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  app_version TEXT NOT NULL CHECK (char_length(app_version) BETWEEN 1 AND 32),
  app_build TEXT CHECK (app_build IS NULL OR char_length(app_build) BETWEEN 1 AND 32),
  first_opened_at TIMESTAMPTZ NOT NULL,
  last_opened_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_installations_first_open
  ON analytics_installations(first_opened_at);
CREATE INDEX IF NOT EXISTS idx_analytics_installations_last_open
  ON analytics_installations(last_opened_at);

-- Uma instalação pode ser usada por mais de uma conta sem reatribuir o histórico.
CREATE TABLE IF NOT EXISTS analytics_installation_users (
  installation_id UUID NOT NULL REFERENCES analytics_installations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_identified_at TIMESTAMPTZ NOT NULL,
  last_identified_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (installation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_installation_users_user
  ON analytics_installation_users(user_id);

CREATE TABLE IF NOT EXISTS analytics_activity_days (
  installation_id UUID NOT NULL REFERENCES analytics_installations(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  app_version TEXT NOT NULL CHECK (char_length(app_version) BETWEEN 1 AND 32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (installation_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_activity_date
  ON analytics_activity_days(activity_date);

CREATE TABLE IF NOT EXISTS analytics_user_activity_days (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_activity_date
  ON analytics_user_activity_days(activity_date);

-- O app escreve somente pela API. Nenhum cliente Supabase lê essas tabelas diretamente.
ALTER TABLE analytics_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_installation_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_activity_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_user_activity_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON analytics_installations FROM anon, authenticated;
REVOKE ALL ON analytics_installation_users FROM anon, authenticated;
REVOKE ALL ON analytics_activity_days FROM anon, authenticated;
REVOKE ALL ON analytics_user_activity_days FROM anon, authenticated;
