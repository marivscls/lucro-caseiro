-- Vínculo opcional de fornecedor (FK) em insumos e embalagens.
-- Fase 2 da feature Fornecedores: além de cadastrar fornecedores, agora um
-- insumo (materials) ou uma embalagem (packaging) pode apontar para um
-- fornecedor cadastrado. Nullable: o vínculo é opcional. ON DELETE SET NULL:
-- excluir um fornecedor não apaga o insumo/embalagem, só solta o vínculo.
-- O campo de texto livre `packaging.supplier` (legado) é mantido para não
-- perder dados já digitados.

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE packaging
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- Índices compostos por usuário para responder "o que eu compro deste fornecedor".
CREATE INDEX IF NOT EXISTS idx_materials_user_supplier ON materials (user_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_packaging_user_supplier ON packaging (user_id, supplier_id);
