-- Massa de testes do Lucro Caseiro (rodar no SQL editor do Supabase).
-- Aplica na conta marianadosreisvasconcelos7@gmail.com (ajuste o e-mail abaixo se precisar). Idempotente "na prática": pode
-- rodar mais de uma vez, mas vai duplicar os dados (apague antes se precisar).
--
-- Para limpar depois (apaga SÓ os dados de demonstração, pelo prefixo [demo]):
--   DELETE FROM quotes WHERE title LIKE '[demo]%';
--   DELETE FROM orders WHERE title LIKE '[demo]%';
--   DELETE FROM sales WHERE notes = '[demo]';
--   DELETE FROM finance_entries WHERE description LIKE '[demo]%';
--   DELETE FROM products WHERE name LIKE '[demo]%';
--   DELETE FROM materials WHERE name LIKE '[demo]%';
--   DELETE FROM clients WHERE notes = '[demo]';

DO $$
DECLARE
  v_user uuid;
  c_joana uuid;
  c_carla uuid;
  c_renata uuid;
  c_bia uuid;
  c_fer uuid;
  c_paula uuid;
  p_brigadeiro uuid;
  p_bolopote uuid;
  p_bolokg uuid;
  p_topo uuid;
  p_caixinha uuid;
  p_convite uuid;
  p_marmita uuid;
  p_brownie uuid;
  p_lembranca uuid;
  p_torta uuid;
  v_sale uuid;
  v_order uuid;
BEGIN
  SELECT id INTO v_user FROM users WHERE email = 'marianadosreisvasconcelos7@gmail.com';
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuário não encontrado para esse e-mail'; END IF;

  ------------------------------------------------------------------ clientes
  INSERT INTO clients (user_id, name, phone, birthday, tags, notes) VALUES
    (v_user, 'Joana Silva', '11999990001', (date_trunc('month', now()) + interval '20 days')::date, '{vip}', '[demo]') RETURNING id INTO c_joana;
  INSERT INTO clients (user_id, name, phone, birthday, tags, notes) VALUES
    (v_user, 'Carla Mendes', '11999990002', '1990-03-14', '{}', '[demo]') RETURNING id INTO c_carla;
  INSERT INTO clients (user_id, name, phone, birthday, tags, notes) VALUES
    (v_user, 'Renata Souza', '21988880003', NULL, '{festa}', '[demo]') RETURNING id INTO c_renata;
  INSERT INTO clients (user_id, name, phone, birthday, tags, notes) VALUES
    (v_user, 'Bia Costa', NULL, '1985-11-02', '{}', '[demo]') RETURNING id INTO c_bia;
  INSERT INTO clients (user_id, name, phone, birthday, tags, notes) VALUES
    (v_user, 'Fernanda Lima', '31977770005', NULL, '{atacado}', '[demo]') RETURNING id INTO c_fer;
  INSERT INTO clients (user_id, name, phone, birthday, tags, notes) VALUES
    (v_user, 'Paula Andrade', '41966660006', (date_trunc('month', now()) + interval '5 days')::date, '{}', '[demo]') RETURNING id INTO c_paula;

  ------------------------------------------------------------------ produtos
  INSERT INTO products (user_id, name, category, sale_price, sale_unit, cost_price, stock_quantity, stock_alert_threshold, is_active, description) VALUES
    (v_user, '[demo] Brigadeiro gourmet', 'doces', 4.50, 'unit', 1.80, 120, 30, true, 'Caixinha individual'),
    (v_user, '[demo] Bolo de pote', 'doces', 14.00, 'unit', 5.50, 18, 10, true, 'Chocolate com morango')
    ;
  SELECT id INTO p_brigadeiro FROM products WHERE user_id = v_user AND name = '[demo] Brigadeiro gourmet';
  SELECT id INTO p_bolopote FROM products WHERE user_id = v_user AND name = '[demo] Bolo de pote';

  INSERT INTO products (user_id, name, category, sale_price, sale_unit, cost_price, stock_quantity, stock_alert_threshold, is_active, description) VALUES
    (v_user, '[demo] Bolo caseiro (kg)', 'doces', 55.00, 'kg', 22.00, NULL, NULL, true, 'Vendido por peso') RETURNING id INTO p_bolokg;
  INSERT INTO products (user_id, name, category, sale_price, sale_unit, cost_price, stock_quantity, stock_alert_threshold, is_active, description) VALUES
    (v_user, '[demo] Topo de bolo personalizado', 'papelaria', 38.00, 'unit', 9.00, 5, 2, true, 'Tema à escolha') RETURNING id INTO p_topo;
  INSERT INTO products (user_id, name, category, sale_price, sale_unit, cost_price, stock_quantity, stock_alert_threshold, is_active, description) VALUES
    (v_user, '[demo] Caixinha personalizada', 'papelaria', 5.50, 'unit', 1.60, 80, 20, true, 'Kit festa') RETURNING id INTO p_caixinha;
  INSERT INTO products (user_id, name, category, sale_price, sale_unit, cost_price, stock_quantity, stock_alert_threshold, is_active, description) VALUES
    (v_user, '[demo] Convite de aniversário', 'papelaria', 3.20, 'unit', 0.90, 2, 15, true, 'Estoque baixo de propósito') RETURNING id INTO p_convite;
  INSERT INTO products (user_id, name, category, sale_price, sale_unit, cost_price, stock_quantity, stock_alert_threshold, is_active, description) VALUES
    (v_user, '[demo] Marmita fit', 'salgados', 22.00, 'unit', 11.00, 25, 8, true, 'Congelada 500g') RETURNING id INTO p_marmita;
  INSERT INTO products (user_id, name, category, sale_price, sale_unit, cost_price, stock_quantity, stock_alert_threshold, is_active, description) VALUES
    (v_user, '[demo] Brownie recheado', 'doces', 9.00, 'unit', 3.20, 0, 10, true, 'Sem estoque de propósito') RETURNING id INTO p_brownie;
  INSERT INTO products (user_id, name, category, sale_price, sale_unit, cost_price, stock_quantity, stock_alert_threshold, is_active, description) VALUES
    (v_user, '[demo] Lembrancinha maternidade', 'papelaria', 7.80, 'unit', 2.40, 40, 10, true, NULL) RETURNING id INTO p_lembranca;
  INSERT INTO products (user_id, name, category, sale_price, sale_unit, cost_price, stock_quantity, stock_alert_threshold, is_active, description) VALUES
    (v_user, '[demo] Torta salgada (kg)', 'salgados', 48.00, 'kg', 19.00, NULL, NULL, true, 'Por encomenda') RETURNING id INTO p_torta;

  ------------------------------------------------------------------ insumos
  INSERT INTO materials (user_id, name, unit, stock_quantity, stock_alert_threshold, cost_per_unit, content_per_unit, content_unit, notes) VALUES
    (v_user, '[demo] Leite condensado', 'un', 12, 6, 6.90, 395, 'g', NULL),
    (v_user, '[demo] Chocolate em pó', 'kg', 1.2, 2, 38.00, NULL, NULL, 'Abaixo do alerta'),
    (v_user, '[demo] Papel fotográfico A4', 'folha', 45, 20, 2.10, NULL, NULL, NULL),
    (v_user, '[demo] Fita de cetim rosa', 'm', 8, 10, 1.20, NULL, NULL, 'Abaixo do alerta'),
    (v_user, '[demo] Embalagem pote 250ml', 'un', 60, 25, 0.85, NULL, NULL, NULL),
    (v_user, '[demo] Farinha de trigo', 'kg', 5, 2, 5.40, NULL, NULL, NULL);

  ------------------------------------------------------------------ vendas (3 meses)
  -- mês atual
  INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at)
    VALUES (v_user, c_joana, 'paid', 'pix', 73.00, '[demo]', now() - interval '2 hours') RETURNING id INTO v_sale;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale, p_brigadeiro, 10, 4.50, 45.00), (v_sale, p_bolopote, 2, 14.00, 28.00);
  INSERT INTO finance_entries (user_id, type, category, amount, description, sale_id, date)
    VALUES (v_user, 'income', 'sale', 73.00, '[demo] Venda - Joana', v_sale, current_date);

  INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at)
    VALUES (v_user, c_carla, 'paid', 'cash', 82.50, '[demo]', now() - interval '1 day') RETURNING id INTO v_sale;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale, p_bolokg, 1.5, 55.00, 82.50);
  INSERT INTO finance_entries (user_id, type, category, amount, description, sale_id, date)
    VALUES (v_user, 'income', 'sale', 82.50, '[demo] Venda - Carla', v_sale, current_date - 1);

  INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at)
    VALUES (v_user, c_renata, 'pending', 'credit', 110.00, '[demo]', now() - interval '3 days') RETURNING id INTO v_sale;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale, p_marmita, 5, 22.00, 110.00);

  INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at)
    VALUES (v_user, NULL, 'paid', 'card', 64.00, '[demo]', now() - interval '5 days') RETURNING id INTO v_sale;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale, p_topo, 1, 38.00, 38.00), (v_sale, p_lembranca, 2, 7.80, 15.60), (v_sale, p_convite, 3, 3.20, 9.60);
  UPDATE sales SET total = 63.20 WHERE id = v_sale;
  INSERT INTO finance_entries (user_id, type, category, amount, description, sale_id, date)
    VALUES (v_user, 'income', 'sale', 63.20, '[demo] Venda avulsa', v_sale, current_date - 5);

  INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at)
    VALUES (v_user, c_fer, 'pending', 'credit', 220.00, '[demo]', now() - interval '8 days') RETURNING id INTO v_sale;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale, p_caixinha, 40, 5.50, 220.00);

  -- mês passado
  INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at)
    VALUES (v_user, c_joana, 'paid', 'pix', 135.00, '[demo]', now() - interval '35 days') RETURNING id INTO v_sale;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale, p_brigadeiro, 30, 4.50, 135.00);
  INSERT INTO finance_entries (user_id, type, category, amount, description, sale_id, date)
    VALUES (v_user, 'income', 'sale', 135.00, '[demo] Venda - Joana', v_sale, current_date - 35);

  INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at)
    VALUES (v_user, c_bia, 'paid', 'transfer', 96.00, '[demo]', now() - interval '40 days') RETURNING id INTO v_sale;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale, p_torta, 2, 48.00, 96.00);
  INSERT INTO finance_entries (user_id, type, category, amount, description, sale_id, date)
    VALUES (v_user, 'income', 'sale', 96.00, '[demo] Venda - Bia', v_sale, current_date - 40);

  INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at)
    VALUES (v_user, c_paula, 'cancelled', 'pix', 28.00, '[demo]', now() - interval '42 days') RETURNING id INTO v_sale;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale, p_bolopote, 2, 14.00, 28.00);

  -- dois meses atrás
  INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at)
    VALUES (v_user, c_carla, 'paid', 'pix', 165.00, '[demo]', now() - interval '65 days') RETURNING id INTO v_sale;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale, p_bolokg, 3, 55.00, 165.00);
  INSERT INTO finance_entries (user_id, type, category, amount, description, sale_id, date)
    VALUES (v_user, 'income', 'sale', 165.00, '[demo] Venda - Carla', v_sale, current_date - 65);

  INSERT INTO sales (user_id, client_id, status, payment_method, total, notes, sold_at)
    VALUES (v_user, c_fer, 'paid', 'cash', 156.00, '[demo]', now() - interval '70 days') RETURNING id INTO v_sale;
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale, p_lembranca, 20, 7.80, 156.00);
  INSERT INTO finance_entries (user_id, type, category, amount, description, sale_id, date)
    VALUES (v_user, 'income', 'sale', 156.00, '[demo] Venda - Fernanda', v_sale, current_date - 70);

  ------------------------------------------------------------------ despesas
  INSERT INTO finance_entries (user_id, type, category, amount, description, is_fixed, date) VALUES
    (v_user, 'expense', 'material', 87.40, '[demo] Compra de insumos (mercado)', false, current_date - 3),
    (v_user, 'expense', 'packaging', 45.00, '[demo] Embalagens e fitas', false, current_date - 6),
    (v_user, 'expense', 'utility', 120.00, '[demo] Conta de luz (parte do negócio)', true, current_date - 10),
    (v_user, 'expense', 'transport', 32.00, '[demo] Entregas da semana', false, current_date - 2),
    (v_user, 'expense', 'fee', 19.90, '[demo] Taxa da maquininha', true, current_date - 12),
    (v_user, 'expense', 'material', 64.20, '[demo] Papel e tinta', false, current_date - 38);

  ------------------------------------------------------------------ encomendas
  INSERT INTO orders (user_id, client_id, title, delivery_date, delivery_time, status, amount, deposit, theme, honoree, colors, notes) VALUES
    (v_user, c_renata, '[demo] Kit festa Safari completo', current_date + 3, '14:00', 'in_production', 320.00, 160.00, 'Safari', 'Theo, 2 anos', 'verde e amarelo', '30 convites, 30 caixinhas, topo de bolo'),
    (v_user, c_joana, '[demo] Bolo 2kg + 50 brigadeiros', current_date + 1, '10:00', 'ready', 335.00, 100.00, NULL, NULL, NULL, 'Festa de 15 anos'),
    (v_user, c_paula, '[demo] Lembrancinhas maternidade', current_date + 7, NULL, 'pending', 156.00, NULL, 'Ursinhos', 'Alice', 'rosa e dourado', '20 unidades'),
    (v_user, NULL, '[demo] Marmitas da semana (10un)', current_date + 2, '18:30', 'pending', 220.00, NULL, NULL, NULL, NULL, 'Retirada no local'),
    (v_user, c_bia, '[demo] Torta salgada 3kg', current_date - 2, NULL, 'done', 144.00, NULL, NULL, NULL, NULL, 'Entregue');

  ------------------------------------------------------------------ orçamentos
  INSERT INTO quotes (user_id, client_id, client_name, title, items, total, status, valid_until, notes) VALUES
    (v_user, c_renata, NULL, '[demo] Kit festa Princesas', '[{"description":"Convite personalizado","quantity":40,"unitPrice":3.2},{"description":"Caixinha milk","quantity":40,"unitPrice":5.5},{"description":"Topo de bolo","quantity":1,"unitPrice":38}]'::jsonb, 386.00, 'pending', current_date + 10, 'Entrega combinada para o fim do mês'),
    (v_user, NULL, 'Mãe da Sofia (indicação)', '[demo] Lembrancinhas batizado', '[{"description":"Lembrancinha com tag","quantity":25,"unitPrice":7.8}]'::jsonb, 195.00, 'pending', current_date + 5, NULL),
    (v_user, c_fer, NULL, '[demo] Caixinhas corporativas', '[{"description":"Caixinha com logo","quantity":100,"unitPrice":4.9}]'::jsonb, 490.00, 'rejected', NULL, 'Achou caro; ofereci 80un'),
    (v_user, c_joana, NULL, '[demo] Mesa de doces casamento', '[{"description":"Brigadeiro gourmet","quantity":150,"unitPrice":4.0},{"description":"Bolo 3kg","quantity":1,"unitPrice":165}]'::jsonb, 765.00, 'pending', current_date + 15, 'Degustação agendada');

  -- orçamento aprovado vinculado a uma encomenda (fluxo completo)
  INSERT INTO orders (user_id, client_id, title, delivery_date, status, amount, deposit, theme, notes)
    VALUES (v_user, c_paula, '[demo] Kit chá revelação', current_date + 12, 'pending', 264.00, 130.00, 'Chá revelação', '40x Tag personalizada, 40x Mini caixinha')
    RETURNING id INTO v_order;
  INSERT INTO quotes (user_id, client_id, title, items, total, status, order_id, notes)
    VALUES (v_user, c_paula, '[demo] Kit chá revelação', '[{"description":"Tag personalizada","quantity":40,"unitPrice":2.6},{"description":"Mini caixinha","quantity":40,"unitPrice":4.0}]'::jsonb, 264.00, 'accepted', v_order, 'Aprovado com 50% de sinal');

  RAISE NOTICE 'Massa de testes criada para o usuário %', v_user;
END $$;
