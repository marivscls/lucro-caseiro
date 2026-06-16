-- Massa de testes do plano FREE — Lucro Caseiro (rodar no SQL Editor do Supabase de produção).
-- Conta alvo: vasconcelosmariana05@gmail.com (ajuste o e-mail na linha do SELECT se precisar).
--
-- Dimensionado PERTO dos limites do FREE pra testar avisos de limite + paywall:
--   clientes 18/20 · vendas no mês 27/30 · receitas 4/5 · embalagens 2/3 · produtos 12 (sem limite).
-- Inclui histórico de meses anteriores (finance/insights), despesas, encomendas (agenda) e orçamentos.
--
-- Idempotente: limpa SÓ os dados [demo] DESTE usuário antes de inserir (pode rodar de novo sem duplicar).
-- Para apagar tudo depois: rode apenas o bloco "LIMPEZA" (copie ele isolado num DO $$ ... $$).
--
-- (Opcional) Garantir que a conta veja os limites do FREE:
--   UPDATE users SET plan = 'free', plan_expires_at = NULL WHERE email = 'vasconcelosmariana05@gmail.com';
-- Voltar pra premium depois:
--   UPDATE users SET plan = 'premium' WHERE email = 'vasconcelosmariana05@gmail.com';

DO $$
DECLARE
  v_user uuid;
  prod_ids uuid[];
  client_ids uuid[];
  v_sale uuid;
  v_pid uuid;
  v_cid uuid;
  v_price numeric;
  v_qty int;
  v_total numeric;
  v_status text;
  v_when timestamptz;
  v_r numeric;
  i int;
  pays text[] := ARRAY['pix','cash','card','credit','transfer'];
BEGIN
  SELECT id INTO v_user FROM users WHERE email = 'vasconcelosmariana05@gmail.com';
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuário não encontrado para esse e-mail'; END IF;

  -- ============================ LIMPEZA (só [demo] deste usuário) ============================
  DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id = v_user AND notes = '[demo]');
  DELETE FROM finance_entries WHERE user_id = v_user AND description LIKE '[demo]%';
  DELETE FROM sales WHERE user_id = v_user AND notes = '[demo]';
  DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = v_user AND name LIKE '[demo]%');
  DELETE FROM recipes WHERE user_id = v_user AND name LIKE '[demo]%';
  DELETE FROM labels WHERE user_id = v_user AND name LIKE '[demo]%';
  DELETE FROM packaging WHERE user_id = v_user AND name LIKE '[demo]%';
  DELETE FROM products WHERE user_id = v_user AND name LIKE '[demo]%';
  DELETE FROM materials WHERE user_id = v_user AND name LIKE '[demo]%';
  DELETE FROM quotes WHERE user_id = v_user AND title LIKE '[demo]%';
  DELETE FROM orders WHERE user_id = v_user AND title LIKE '[demo]%';
  DELETE FROM clients WHERE user_id = v_user AND notes = '[demo]';

  -- ============================ CLIENTES (18 / limite 20) ============================
  INSERT INTO clients (user_id, name, phone, birthday, tags, notes)
  SELECT v_user, t.n, t.p, t.b, '{}'::text[], '[demo]'
  FROM unnest(
    ARRAY['Joana Silva','Carla Mendes','Renata Souza','Bia Costa','Fernanda Lima','Paula Andrade','Aline Rocha','Camila Nunes','Patrícia Gomes','Juliana Dias','Marina Castro','Tânia Ribeiro','Sandra Pinto','Vanessa Melo','Letícia Alves','Débora Ramos','Simone Teixeira','Cris Barbosa']::text[],
    ARRAY['11999990001','11999990002','21988880003',NULL,'31977770005','41966660006','11955550007','11944440008',NULL,'21933330010','11922220011','85911110012','11900000013',NULL,'11988880015','61977770016','11966660017','47955550018']::text[],
    ARRAY[NULL,'1990-03-14',NULL,'1985-11-02',NULL,NULL,'1993-07-21',NULL,'1988-01-09',NULL,'1995-12-30',NULL,'1979-05-17',NULL,'2000-09-08',NULL,'1992-02-25',NULL]::date[]
  ) AS t(n, p, b);

  -- 2 aniversários no mês atual (testa cartão de aniversário)
  UPDATE clients SET birthday = (date_trunc('month', now()) + interval '4 days')::date
    WHERE id IN (SELECT id FROM clients WHERE user_id = v_user AND notes = '[demo]' ORDER BY name LIMIT 1);
  UPDATE clients SET birthday = (date_trunc('month', now()) + interval '12 days')::date
    WHERE id IN (SELECT id FROM clients WHERE user_id = v_user AND notes = '[demo]' ORDER BY name DESC LIMIT 1);

  -- ============================ PRODUTOS (12) ============================
  INSERT INTO products (user_id, name, category, sale_price, sale_unit, cost_price, stock_quantity, stock_alert_threshold, is_active, description) VALUES
    (v_user, '[demo] Brigadeiro gourmet', 'doces', 4.50, 'unit', 1.80, 120, 30, true, 'Caixinha individual'),
    (v_user, '[demo] Bolo de pote', 'doces', 14.00, 'unit', 5.50, 18, 10, true, 'Chocolate com morango'),
    (v_user, '[demo] Bolo caseiro (kg)', 'doces', 55.00, 'kg', 22.00, NULL, NULL, true, 'Vendido por peso'),
    (v_user, '[demo] Brownie recheado', 'doces', 9.00, 'unit', 3.20, 0, 10, true, 'Sem estoque de propósito'),
    (v_user, '[demo] Kit doces festa', 'doces', 50.00, 'unit', 20.00, 10, 3, true, 'Caixa com 4 sabores'),
    (v_user, '[demo] Marmita fit', 'salgados', 22.00, 'unit', 11.00, 25, 8, true, 'Congelada 500g'),
    (v_user, '[demo] Coxinha (cento)', 'salgados', 90.00, 'unit', 40.00, 6, 5, true, 'Cento congelado'),
    (v_user, '[demo] Torta salgada (kg)', 'salgados', 48.00, 'kg', 19.00, NULL, NULL, true, 'Por encomenda'),
    (v_user, '[demo] Topo de bolo', 'papelaria', 38.00, 'unit', 9.00, 5, 2, true, 'Tema à escolha'),
    (v_user, '[demo] Caixinha personalizada', 'papelaria', 5.50, 'unit', 1.60, 80, 20, true, 'Kit festa'),
    (v_user, '[demo] Convite de aniversário', 'papelaria', 3.20, 'unit', 0.90, 2, 15, true, 'Estoque baixo de propósito'),
    (v_user, '[demo] Lembrancinha maternidade', 'papelaria', 7.80, 'unit', 2.40, 40, 10, true, NULL);

  -- ============================ INSUMOS (materiais) ============================
  INSERT INTO materials (user_id, name, unit, stock_quantity, stock_alert_threshold, cost_per_unit, content_per_unit, content_unit, notes) VALUES
    (v_user, '[demo] Leite condensado', 'un', 12, 6, 6.90, 395, 'g', NULL),
    (v_user, '[demo] Chocolate em pó', 'kg', 1.2, 2, 38.00, NULL, NULL, 'Abaixo do alerta'),
    (v_user, '[demo] Farinha de trigo', 'kg', 5, 2, 5.40, NULL, NULL, NULL),
    (v_user, '[demo] Creme de leite', 'un', 20, 8, 3.20, 200, 'g', NULL),
    (v_user, '[demo] Papel fotográfico A4', 'folha', 45, 20, 2.10, NULL, NULL, NULL),
    (v_user, '[demo] Fita de cetim rosa', 'm', 8, 10, 1.20, NULL, NULL, 'Abaixo do alerta'),
    (v_user, '[demo] Embalagem pote 250ml', 'un', 60, 25, 0.85, NULL, NULL, NULL),
    (v_user, '[demo] Forma de marmita', 'un', 30, 15, 0.70, NULL, NULL, NULL);

  -- ============================ RECEITAS (4 / limite 5) ============================
  INSERT INTO recipes (user_id, name, category, yield_quantity, yield_unit, total_cost, cost_per_unit, instructions) VALUES
    (v_user, '[demo] Massa de brigadeiro', 'doces', 50, 'un', 18.00, 0.36, 'Misturar tudo e cozinhar até desgrudar do fundo.'),
    (v_user, '[demo] Bolo de chocolate', 'doces', 2, 'kg', 22.00, 11.00, 'Assar a 180°C por 40 minutos.'),
    (v_user, '[demo] Recheio quatro leites', 'doces', 1, 'kg', 16.00, 16.00, NULL),
    (v_user, '[demo] Massa de coxinha', 'salgados', 100, 'un', 35.00, 0.35, 'Modelar, rechear e empanar.');

  INSERT INTO recipe_ingredients (recipe_id, material_id, quantity, unit)
  SELECT r.id, m.id, 3, 'un' FROM recipes r JOIN materials m ON m.user_id = r.user_id
   WHERE r.user_id = v_user AND r.name = '[demo] Massa de brigadeiro' AND m.name = '[demo] Leite condensado';
  INSERT INTO recipe_ingredients (recipe_id, material_id, quantity, unit)
  SELECT r.id, m.id, 0.3, 'kg' FROM recipes r JOIN materials m ON m.user_id = r.user_id
   WHERE r.user_id = v_user AND r.name = '[demo] Massa de brigadeiro' AND m.name = '[demo] Chocolate em pó';
  INSERT INTO recipe_ingredients (recipe_id, material_id, quantity, unit)
  SELECT r.id, m.id, 1, 'kg' FROM recipes r JOIN materials m ON m.user_id = r.user_id
   WHERE r.user_id = v_user AND r.name = '[demo] Bolo de chocolate' AND m.name = '[demo] Farinha de trigo';

  -- ============================ EMBALAGENS (2 / limite 3) ============================
  INSERT INTO packaging (user_id, name, type, unit_cost, supplier) VALUES
    (v_user, '[demo] Caixa kraft P', 'box', 1.20, 'Embalagens Brasil'),
    (v_user, '[demo] Sacola transparente', 'bag', 0.45, NULL);

  -- arrays auxiliares p/ gerar as vendas
  SELECT array_agg(id) INTO prod_ids FROM products WHERE user_id = v_user AND name LIKE '[demo]%';
  SELECT array_agg(id) INTO client_ids FROM clients WHERE user_id = v_user AND notes = '[demo]';

  -- ============================ VENDAS DO MÊS (27 / limite 30) ============================
  FOR i IN 1..27 LOOP
    v_pid := prod_ids[1 + floor(random() * array_length(prod_ids, 1))::int];
    IF random() < 0.8 THEN
      v_cid := client_ids[1 + floor(random() * array_length(client_ids, 1))::int];
    ELSE
      v_cid := NULL;
    END IF;
    SELECT sale_price INTO v_price FROM products WHERE id = v_pid;
    v_qty := (1 + floor(random() * 8))::int;
    v_total := round((v_price * v_qty)::numeric, 2);
    v_r := random();
    v_status := CASE WHEN v_r < 0.7 THEN 'paid' WHEN v_r < 0.9 THEN 'pending' ELSE 'cancelled' END;
    v_when := date_trunc('month', now()) + random() * (now() - date_trunc('month', now()));
    INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at, created_at)
      VALUES (v_user, v_cid, v_status::sale_status, (pays[1 + floor(random() * 5)::int])::payment_method, v_total, '[demo]', v_when, v_when)
      RETURNING id INTO v_sale;
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
      VALUES (v_sale, v_pid, v_qty, v_price, v_total);
    IF v_status = 'paid' THEN
      INSERT INTO finance_entries (user_id, type, category, amount, description, sale_id, date)
        VALUES (v_user, 'income', 'sale', v_total, '[demo] Venda', v_sale, v_when::date);
    END IF;
  END LOOP;

  -- ============================ VENDAS DE MESES ANTERIORES (histórico) ============================
  FOR i IN 1..10 LOOP
    v_pid := prod_ids[1 + floor(random() * array_length(prod_ids, 1))::int];
    v_cid := client_ids[1 + floor(random() * array_length(client_ids, 1))::int];
    SELECT sale_price INTO v_price FROM products WHERE id = v_pid;
    v_qty := (1 + floor(random() * 10))::int;
    v_total := round((v_price * v_qty)::numeric, 2);
    v_when := (date_trunc('month', now()) - (interval '1 month' * (1 + floor(random() * 3)::int))) + (random() * interval '25 days');
    INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at, created_at)
      VALUES (v_user, v_cid, 'paid'::sale_status, (pays[1 + floor(random() * 5)::int])::payment_method, v_total, '[demo]', v_when, v_when)
      RETURNING id INTO v_sale;
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
      VALUES (v_sale, v_pid, v_qty, v_price, v_total);
    INSERT INTO finance_entries (user_id, type, category, amount, description, sale_id, date)
      VALUES (v_user, 'income', 'sale', v_total, '[demo] Venda', v_sale, v_when::date);
  END LOOP;

  -- ============================ DESPESAS ============================
  INSERT INTO finance_entries (user_id, type, category, amount, description, is_fixed, date) VALUES
    (v_user, 'expense', 'material', 87.40, '[demo] Compra de insumos (mercado)', false, current_date - 3),
    (v_user, 'expense', 'packaging', 45.00, '[demo] Embalagens e fitas', false, current_date - 6),
    (v_user, 'expense', 'utility', 120.00, '[demo] Conta de luz (parte do negócio)', true, current_date - 10),
    (v_user, 'expense', 'transport', 32.00, '[demo] Entregas da semana', false, current_date - 2),
    (v_user, 'expense', 'fee', 19.90, '[demo] Taxa da maquininha', true, current_date - 12),
    (v_user, 'expense', 'material', 64.20, '[demo] Papel e tinta', false, current_date - 38);

  -- ============================ ENCOMENDAS (agenda) ============================
  INSERT INTO orders (user_id, client_id, title, delivery_date, delivery_time, status, amount, deposit, theme, honoree, colors, notes) VALUES
    (v_user, client_ids[3], '[demo] Kit festa Safari completo', current_date + 3, '14:00', 'in_production', 320.00, 160.00, 'Safari', 'Theo, 2 anos', 'verde e amarelo', '30 convites, 30 caixinhas, topo de bolo'),
    (v_user, client_ids[1], '[demo] Bolo 2kg + 50 brigadeiros', current_date + 1, '10:00', 'ready', 335.00, 100.00, NULL, NULL, NULL, 'Festa de 15 anos'),
    (v_user, client_ids[6], '[demo] Lembrancinhas maternidade', current_date + 7, NULL, 'pending', 156.00, NULL, 'Ursinhos', 'Alice', 'rosa e dourado', '20 unidades'),
    (v_user, NULL, '[demo] Marmitas da semana (10un)', current_date + 2, '18:30', 'pending', 220.00, NULL, NULL, NULL, NULL, 'Retirada no local'),
    (v_user, client_ids[4], '[demo] Torta salgada 3kg', current_date - 2, NULL, 'done', 144.00, NULL, NULL, NULL, NULL, 'Entregue');

  -- ============================ ORÇAMENTOS ============================
  INSERT INTO quotes (user_id, client_id, client_name, title, items, total, status, valid_until, notes) VALUES
    (v_user, client_ids[3], NULL, '[demo] Kit festa Princesas', '[{"description":"Convite personalizado","quantity":40,"unitPrice":3.2},{"description":"Caixinha milk","quantity":40,"unitPrice":5.5},{"description":"Topo de bolo","quantity":1,"unitPrice":38}]'::jsonb, 386.00, 'pending', current_date + 10, 'Entrega combinada para o fim do mês'),
    (v_user, NULL, 'Mãe da Sofia (indicação)', '[demo] Lembrancinhas batizado', '[{"description":"Lembrancinha com tag","quantity":25,"unitPrice":7.8}]'::jsonb, 195.00, 'pending', current_date + 5, NULL),
    (v_user, client_ids[5], NULL, '[demo] Caixinhas corporativas', '[{"description":"Caixinha com logo","quantity":100,"unitPrice":4.9}]'::jsonb, 490.00, 'rejected', NULL, 'Achou caro; ofereci 80un'),
    (v_user, client_ids[1], NULL, '[demo] Mesa de doces casamento', '[{"description":"Brigadeiro gourmet","quantity":150,"unitPrice":4.0},{"description":"Bolo 3kg","quantity":1,"unitPrice":165}]'::jsonb, 765.00, 'pending', current_date + 15, 'Degustação agendada');

  RAISE NOTICE 'FREE seed pronto p/ % — 18 clientes, 27 vendas no mês, 4 receitas, 2 embalagens, 12 produtos, 8 insumos.', v_user;
END $$;
