-- Cadastro de fornecedores (suppliers).
-- Entidade própria — antes "fornecedor" era só um campo de texto livre em
-- ingredients/packaging. Aqui vira um registro reutilizável (nome obrigatório;
-- telefone/email/endereço/notas opcionais). Toda query é user-scoped.

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices compostos por usuário (toda query filtra por user_id).
CREATE INDEX IF NOT EXISTS idx_suppliers_user ON suppliers (user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_name ON suppliers (user_id, name);
