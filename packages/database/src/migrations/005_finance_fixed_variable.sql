-- Separar gastos FIXOS x VARIAVEIS. Flag booleana por lancamento.
-- Aplica-se apenas a despesas (type = 'expense'): fixo = recorrente (aluguel,
-- internet), variavel = por pedido (ingredientes). Entradas (income) ignoram.
ALTER TABLE finance_entries
  ADD COLUMN is_fixed BOOLEAN NOT NULL DEFAULT false;
