-- Massa completa para TODAS as telas do Lucro Caseiro.
-- Conta padrao: marianadosreisvasconcelos7@gmail.com
-- Para outra conta, execute antes: SET app.seed_email = 'conta@exemplo.com';
-- Execute no SQL Editor do Supabase. Idempotente: remove apenas dados [massa] desta conta.
-- ATENCAO: promove a conta para o plano professional para liberar os recursos avancados.

DO $$
DECLARE
  v_email text := COALESCE(NULLIF(current_setting('app.seed_email', true), ''), 'marianadosreisvasconcelos7@gmail.com');
  v_user uuid;
  v_sale uuid;
  v_finance uuid;
  v_order uuid;
  v_purchase uuid;
  v_product uuid;
  v_recipe uuid;
  v_service uuid;
  v_service_package uuid;
  v_service_purchase uuid;
  v_production uuid;
  v_retail_document uuid;
  v_total numeric;
  v_price numeric;
  v_qty numeric;
  v_when timestamptz;
  v_status sale_status;
  v_payment payment_method;
  client_ids uuid[];
  product_ids uuid[];
  material_ids uuid[];
  supplier_ids uuid[];
  recipe_ids uuid[];
  packaging_ids uuid[];
  service_ids uuid[];
  i integer;
BEGIN
  SELECT id INTO v_user
  FROM public.users
  WHERE lower(email) = lower(v_email);

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuario % nao encontrado em public.users', v_email;
  END IF;

  -- Libera todas as telas e deixa o perfil pronto para demonstracao.
  UPDATE public.users
  SET name = 'Mariana Vasconcelos',
      business_name = 'Delicias da Mariana',
      business_type = 'food',
      phone = '11987654321',
      plan = 'professional',
      plan_expires_at = now() + interval '1 year',
      is_active = true
  WHERE id = v_user;

  -- =============================== LIMPEZA SEGURA ===============================
  DELETE FROM service_package_session_usages WHERE user_id = v_user;
  DELETE FROM public_service_booking_requests WHERE user_id = v_user AND notes LIKE '[massa]%';
  DELETE FROM service_package_purchases WHERE user_id = v_user;
  DELETE FROM service_packages WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM service_add_ons WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM service_variations WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM retail_promotions WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM retail_business_accounts WHERE user_id = v_user AND legal_name LIKE '[massa]%';
  DELETE FROM retail_price_changes WHERE user_id = v_user AND reason LIKE '[massa]%';
  DELETE FROM retail_documents WHERE user_id = v_user AND title LIKE '[massa]%';
  DELETE FROM retail_documents WHERE user_id = v_user AND kind = 'cash_session' AND status = 'open';
  DELETE FROM production_runs WHERE user_id = v_user AND notes LIKE '[massa]%';
  DELETE FROM stock_movements WHERE user_id = v_user AND reason LIKE '[massa]%';
  DELETE FROM labels WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM pricing_calculations WHERE user_id = v_user
    AND product_id IN (SELECT id FROM products WHERE user_id = v_user AND name LIKE '[massa]%');
  DELETE FROM quotes WHERE user_id = v_user AND title LIKE '[massa]%';
  DELETE FROM orders WHERE user_id = v_user AND title LIKE '[massa]%';
  DELETE FROM services WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM purchases WHERE user_id = v_user AND description LIKE '[massa]%';
  DELETE FROM recurring_expenses WHERE user_id = v_user AND description LIKE '[massa]%';
  DELETE FROM product_components WHERE product_id IN (SELECT id FROM products WHERE user_id = v_user AND name LIKE '[massa]%');
  DELETE FROM product_packaging WHERE product_id IN (SELECT id FROM products WHERE user_id = v_user AND name LIKE '[massa]%');
  DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = v_user AND name LIKE '[massa]%');
  DELETE FROM finance_entries WHERE user_id = v_user AND description LIKE '[massa]%';
  DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id = v_user AND notes = '[massa]');
  DELETE FROM sales WHERE user_id = v_user AND notes = '[massa]';
  UPDATE products SET recipe_id = NULL WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM products WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM recipes WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM packaging WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM materials WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM suppliers WHERE user_id = v_user AND notes = '[massa]';
  DELETE FROM clients WHERE user_id = v_user AND notes LIKE '[massa]%';
  DELETE FROM business_goals WHERE user_id = v_user;
  DELETE FROM catalog_settings WHERE user_id = v_user;
  DELETE FROM pricing_preferences WHERE user_id = v_user;

  -- =============================== CLIENTES (24) ================================
  INSERT INTO clients (user_id, name, phone, address, birthday, tags, notes, created_at)
  SELECT v_user, x.name, x.phone, x.address, x.birthday, x.tags, '[massa] Cliente demonstracao', now() - x.age
  FROM (VALUES
    ('Ana Beatriz','11990001001','Rua das Flores, 120',current_date - interval '31 years','{vip,bolos}'::text[],interval '18 months'),
    ('Camila Rocha','11990001002','Av. Brasil, 450',current_date - interval '28 years','{festas}'::text[],interval '16 months'),
    ('Juliana Martins','11990001003','Rua Primavera, 88',current_date - interval '35 years','{vip}'::text[],interval '14 months'),
    ('Renata Souza','11990001004','Rua das Acacias, 72',current_date - interval '42 years','{tortas}'::text[],interval '12 months'),
    ('Paula Andrade','11990001005','Alameda Santos, 301',current_date - interval '29 years','{corporativo}'::text[],interval '11 months'),
    ('Fernanda Lima','11990001006','Rua Aurora, 55',current_date - interval '38 years','{atacado}'::text[],interval '10 months'),
    ('Carla Mendes','11990001007','Rua das Palmeiras, 190',current_date - interval '33 years','{doces}'::text[],interval '9 months'),
    ('Joana Silva','11990001008','Av. Central, 1010',current_date - interval '27 years','{vip,indicacao}'::text[],interval '8 months'),
    ('Aline Nunes','11990001009','Rua do Lago, 12',current_date - interval '36 years','{marmitas}'::text[],interval '7 months'),
    ('Patricia Gomes','11990001010','Rua Bela Vista, 98',current_date - interval '40 years','{festas}'::text[],interval '7 months'),
    ('Marina Castro','11990001011','Rua Horizonte, 333',current_date - interval '24 years','{doces}'::text[],interval '6 months'),
    ('Debora Ramos','11990001012','Rua do Sol, 456',current_date - interval '31 years','{bolos}'::text[],interval '6 months'),
    ('Simone Teixeira','11990001013','Av. Paulista, 720',current_date - interval '45 years','{corporativo}'::text[],interval '5 months'),
    ('Vanessa Melo','11990001014','Rua Amarela, 27',current_date - interval '30 years','{fiado}'::text[],interval '5 months'),
    ('Leticia Alves','11990001015','Rua dos Lirios, 64',current_date - interval '26 years','{indicacao}'::text[],interval '4 months'),
    ('Sandra Pinto','11990001016','Rua Verde, 91',current_date - interval '39 years','{salgados}'::text[],interval '4 months'),
    ('Cristina Barbosa','11990001017','Rua Azul, 17',current_date - interval '34 years','{vip}'::text[],interval '3 months'),
    ('Tatiana Ribeiro','11990001018','Rua das Pedras, 202',current_date - interval '37 years','{festas}'::text[],interval '3 months'),
    ('Larissa Freitas','11990001019','Av. Norte, 840',current_date - interval '25 years','{catalogo}'::text[],interval '2 months'),
    ('Bruna Correia','11990001020','Rua Sul, 144',current_date - interval '32 years','{doces}'::text[],interval '2 months'),
    ('Eliane Costa','11990001021','Rua Oeste, 52',current_date - interval '44 years','{marmitas}'::text[],interval '45 days'),
    ('Monica Duarte','11990001022','Rua Leste, 765',current_date - interval '41 years','{atacado}'::text[],interval '35 days'),
    ('Gabriela Moreira','11990001023','Rua Nova, 108',current_date - interval '23 years','{instagram}'::text[],interval '20 days'),
    ('Nathalia Lopes','11990001024','Rua Antiga, 39',current_date - interval '28 years','{indicacao}'::text[],interval '10 days')
  ) AS x(name,phone,address,birthday,tags,age);

  -- Aniversarios proximos para preencher o card da Home.
  UPDATE clients SET birthday = (date_trunc('month', current_date) + interval '4 days')::date
    WHERE user_id = v_user AND phone = '11990001001';
  UPDATE clients SET birthday = (date_trunc('month', current_date) + interval '12 days')::date
    WHERE user_id = v_user AND phone = '11990001008';
  UPDATE clients
  SET next_contact_at = current_date + 2,
      next_contact_reason = 'Confirmar encomenda',
      next_contact_notes = '[massa] Cliente pediu retorno pelo WhatsApp'
  WHERE user_id = v_user AND phone IN ('11990001003', '11990001010', '11990001017');

  SELECT array_agg(id ORDER BY name) INTO client_ids FROM clients WHERE user_id = v_user AND notes LIKE '[massa]%';

  -- ============================== FORNECEDORES (8) ===============================
  INSERT INTO suppliers (user_id,name,phone,email,address,notes) VALUES
    (v_user,'Casa do Confeiteiro','11981110001','vendas@casadoconfeiteiro.com.br','Rua do Mercado, 10','[massa]'),
    (v_user,'Embalagens Bella','11981110002','contato@embalagensbella.com.br','Av. Industrial, 220','[massa]'),
    (v_user,'Distribuidora Doce Mix','11981110003','pedidos@docemix.com.br','Rua das Fabricas, 75','[massa]'),
    (v_user,'Hortifruti Primavera','11981110004',NULL,'Av. das Frutas, 180','[massa]'),
    (v_user,'Papelaria Criativa','11981110005','loja@papelariacriativa.com.br','Rua Colorida, 32','[massa]'),
    (v_user,'Laticinios Serra Azul','11981110006','comercial@serraazul.com.br','Rodovia Sul, km 18','[massa]'),
    (v_user,'Atacado Festa Feliz','11981110007',NULL,'Rua dos Eventos, 901','[massa]'),
    (v_user,'Graos & Cia','11981110008','atendimento@graosecia.com.br','Av. Rural, 44','[massa]');
  SELECT array_agg(id ORDER BY name) INTO supplier_ids FROM suppliers WHERE user_id = v_user AND notes = '[massa]';

  -- ================================ INSUMOS (16) =================================
  INSERT INTO materials (user_id,name,unit,stock_quantity,stock_alert_threshold,cost_per_unit,content_per_unit,content_unit,notes,icon,supplier_id) VALUES
    (v_user,'[massa] Leite condensado','un',28,8,6.90,395,'g','Lata 395g','🥛',supplier_ids[3]),
    (v_user,'[massa] Creme de leite','un',24,8,3.50,200,'g','Caixa 200g','🥛',supplier_ids[6]),
    (v_user,'[massa] Chocolate 50%','kg',4.5,2,39.90,1,'kg','Cacau em po','🍫',supplier_ids[3]),
    (v_user,'[massa] Chocolate nobre','kg',2.2,1,58.00,1,'kg','Gotas meio amargo','🍫',supplier_ids[1]),
    (v_user,'[massa] Farinha de trigo','kg',12,4,5.80,1,'kg',NULL,'🌾',supplier_ids[8]),
    (v_user,'[massa] Acucar refinado','kg',9,3,4.90,1,'kg',NULL,'🧂',supplier_ids[8]),
    (v_user,'[massa] Ovos','un',72,24,0.85,1,'un','Ovos grandes','🥚',supplier_ids[4]),
    (v_user,'[massa] Manteiga','kg',3,1,32.00,1,'kg',NULL,'🧈',supplier_ids[6]),
    (v_user,'[massa] Morango','kg',1.2,2,24.00,1,'kg','Estoque baixo','🍓',supplier_ids[4]),
    (v_user,'[massa] Leite integral','l',8,3,5.20,1,'l',NULL,'🥛',supplier_ids[6]),
    (v_user,'[massa] Granulado belga','kg',1.8,1,42.00,1,'kg',NULL,'🍫',supplier_ids[1]),
    (v_user,'[massa] Corante rosa','ml',180,50,0.08,1,'ml',NULL,'🎨',supplier_ids[1]),
    (v_user,'[massa] Papel fotografico','folha',80,20,2.10,1,'folha',NULL,'📄',supplier_ids[5]),
    (v_user,'[massa] Fita de cetim','m',45,10,1.30,1,'m','Rosa antigo','🎀',supplier_ids[5]),
    (v_user,'[massa] Frango desfiado','kg',3.5,2,26.00,1,'kg',NULL,'🍗',supplier_ids[4]),
    (v_user,'[massa] Requeijao','kg',2,1,28.00,1,'kg',NULL,'🧀',supplier_ids[6]);
  SELECT array_agg(id ORDER BY name) INTO material_ids FROM materials WHERE user_id = v_user AND name LIKE '[massa]%';

  -- =============================== RECEITAS (8) ==================================
  INSERT INTO recipes (user_id,name,category,yield_quantity,yield_unit,total_cost,cost_per_unit,instructions) VALUES
    (v_user,'[massa] Brigadeiro gourmet','Doces',50,'un',42.50,0.85,'Misture os ingredientes e cozinhe em fogo baixo ate o ponto de enrolar.'),
    (v_user,'[massa] Bolo de chocolate','Bolos',2.5,'kg',58.00,23.20,'Asse a massa a 180 graus e recheie depois de fria.'),
    (v_user,'[massa] Recheio quatro leites','Recheios',1.2,'kg',28.40,23.67,'Cozinhe ate formar um creme firme e deixe esfriar.'),
    (v_user,'[massa] Brownie intenso','Doces',24,'un',49.20,2.05,'Asse por 25 minutos para manter o centro umido.'),
    (v_user,'[massa] Torta de morango','Tortas',12,'fatia',67.20,5.60,'Monte a base, creme e finalize com morangos frescos.'),
    (v_user,'[massa] Massa de coxinha','Salgados',100,'un',46.00,0.46,'Cozinhe a massa, modele, recheie e empane.'),
    (v_user,'[massa] Marmita frango cremoso','Marmitas',10,'un',98.00,9.80,'Porcione arroz, legumes e frango em embalagens de 500 ml.'),
    (v_user,'[massa] Bolo de pote morango','Doces',18,'un',79.20,4.40,'Intercale massa, creme e morangos em potes de 250 ml.');
  SELECT array_agg(id ORDER BY name) INTO recipe_ids FROM recipes WHERE user_id = v_user AND name LIKE '[massa]%';

  -- Liga 3 insumos a cada receita para preencher custo e ficha tecnica.
  FOR i IN 1..array_length(recipe_ids,1) LOOP
    INSERT INTO recipe_ingredients (recipe_id,material_id,quantity,unit) VALUES
      (recipe_ids[i],material_ids[1 + ((i - 1) % 8)],2,'un'),
      (recipe_ids[i],material_ids[1 + (i % 8)],0.5,'kg'),
      (recipe_ids[i],material_ids[1 + ((i + 1) % 8)],1,'un');
  END LOOP;

  -- =============================== PRODUTOS (18) =================================
  INSERT INTO products (user_id,name,description,category,code,sale_price,sale_unit,cost_price,recipe_id,stock_quantity,stock_alert_threshold,is_composite,is_active) VALUES
    (v_user,'[massa] Brigadeiro gourmet','Brigadeiro com granulado belga','Doces','789100000001',4.50,'unit',1.35,recipe_ids[1],150,30,false,true),
    (v_user,'[massa] Caixa 6 brigadeiros','Caixa presenteavel com seis unidades','Doces','789100000002',28.00,'unit',10.20,NULL,24,8,true,true),
    (v_user,'[massa] Bolo de chocolate','Bolo recheado vendido por quilo','Bolos','789100000003',74.90,'kg',29.50,recipe_ids[2],NULL,NULL,false,true),
    (v_user,'[massa] Bolo de pote morango','Pote de 250 ml','Doces','789100000004',16.00,'unit',5.90,recipe_ids[8],36,10,false,true),
    (v_user,'[massa] Brownie recheado','Brownie artesanal com brigadeiro','Doces','789100000005',10.00,'unit',3.80,recipe_ids[4],42,12,false,true),
    (v_user,'[massa] Torta de morango','Torta fresca por unidade','Tortas','789100000006',110.00,'unit',48.00,recipe_ids[5],4,2,false,true),
    (v_user,'[massa] Coxinha cento','Cento de coxinhas congeladas','Salgados','789100000007',95.00,'unit',42.00,recipe_ids[6],8,4,false,true),
    (v_user,'[massa] Marmita fit','Frango, arroz integral e legumes','Marmitas','789100000008',24.00,'unit',11.50,recipe_ids[7],30,10,false,true),
    (v_user,'[massa] Kit festa 20 pessoas','Bolo, doces e salgados','Kits','789100000009',420.00,'unit',182.00,NULL,6,2,true,true),
    (v_user,'[massa] Kit degustacao','Selecao com quatro sabores','Kits','789100000010',45.00,'unit',17.00,NULL,15,5,true,true),
    (v_user,'[massa] Mini bolo afetivo','Bolo pequeno personalizado','Bolos','789100000011',55.00,'unit',21.00,NULL,10,3,false,true),
    (v_user,'[massa] Cupcake decorado','Cupcake com tema personalizado','Doces','789100000012',12.00,'unit',4.20,NULL,28,10,false,true),
    (v_user,'[massa] Pao de mel','Pao de mel recheado e embalado','Doces','789100000013',8.50,'unit',3.10,NULL,50,15,false,true),
    (v_user,'[massa] Torta salgada','Torta de frango por quilo','Salgados','789100000014',52.00,'kg',22.00,NULL,NULL,NULL,false,true),
    (v_user,'[massa] Topo de bolo','Topo personalizado em papel','Papelaria','789100000015',42.00,'unit',9.50,NULL,18,5,false,true),
    (v_user,'[massa] Lembrancinha personalizada','Caixinha com nome e tema','Papelaria','789100000016',9.00,'unit',2.80,NULL,80,20,false,true),
    (v_user,'[massa] Etiqueta personalizada','Cartela com 20 etiquetas','Papelaria','789100000017',18.00,'unit',4.00,NULL,35,10,false,true),
    (v_user,'[massa] Produto sazonal inativo','Edicao de Pascoa','Sazonal','789100000018',35.00,'unit',14.00,NULL,0,5,false,false);
  SELECT array_agg(id ORDER BY name) INTO product_ids FROM products WHERE user_id = v_user AND name LIKE '[massa]%';

  UPDATE products
  SET photo_url = CASE
    WHEN name IN ('[massa] Bolo de chocolate','[massa] Mini bolo afetivo','[massa] Kit festa 20 pessoas')
      THEN 'https://images.unsplash.com/photo-1540337706094-da10342c93d8?auto=format&fit=crop&w=600&h=600&q=82'
    WHEN name IN ('[massa] Bolo de pote morango','[massa] Torta de morango')
      THEN 'https://images.unsplash.com/photo-1551198297-e490636298ba?auto=format&fit=crop&w=600&h=600&q=82'
    WHEN name IN ('[massa] Brownie recheado','[massa] Pao de mel','[massa] Produto sazonal inativo')
      THEN 'https://images.unsplash.com/photo-1426869884541-df7117556757?auto=format&fit=crop&w=600&h=600&q=82'
    WHEN name IN ('[massa] Brigadeiro gourmet','[massa] Caixa 6 brigadeiros','[massa] Kit degustacao','[massa] Cupcake decorado')
      THEN 'https://images.unsplash.com/photo-1502597276204-a3833c063739?auto=format&fit=crop&w=600&h=600&q=82'
    WHEN name IN ('[massa] Coxinha cento','[massa] Marmita fit','[massa] Torta salgada')
      THEN 'https://images.unsplash.com/photo-1668665771959-b217076ddde3?auto=format&fit=crop&w=600&h=600&q=82'
    ELSE 'https://images.unsplash.com/photo-1644780764837-ada1e0023cb5?auto=format&fit=crop&w=600&h=600&q=82'
  END
  WHERE user_id = v_user AND name LIKE '[massa]%';

  -- Variações para estoque, venda, compra e PDV.
  UPDATE products
  SET variations = jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Pequeno', 'size', 'P', 'stockQuantity', 18),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Grande', 'size', 'G', 'stockQuantity', 9)
  )
  WHERE user_id = v_user AND name IN ('[massa] Bolo de pote morango', '[massa] Brownie recheado');
  UPDATE products SET public_enabled = false
  WHERE user_id = v_user AND name IN ('[massa] Produto sazonal inativo', '[massa] Torta salgada');

  -- Componentes dos kits (tela de produtos compostos).
  INSERT INTO product_components (product_id,component_product_id,quantity)
  SELECT kit.id, item.id, q.qty FROM
    (SELECT id FROM products WHERE user_id=v_user AND name='[massa] Caixa 6 brigadeiros') kit,
    (SELECT id FROM products WHERE user_id=v_user AND name='[massa] Brigadeiro gourmet') item,
    (SELECT 6::numeric qty) q;
  INSERT INTO product_components (product_id,component_product_id,quantity)
  SELECT kit.id, item.id, q.qty FROM
    (SELECT id FROM products WHERE user_id=v_user AND name='[massa] Kit festa 20 pessoas') kit,
    (SELECT id FROM products WHERE user_id=v_user AND name='[massa] Brigadeiro gourmet') item,
    (SELECT 50::numeric qty) q;

  -- ============================== EMBALAGENS (8) =================================
  INSERT INTO packaging (user_id,name,type,unit_cost,supplier,supplier_id) VALUES
    (v_user,'[massa] Caixa kraft P','box',1.40,NULL,supplier_ids[2]),
    (v_user,'[massa] Caixa bolo 25 cm','box',6.80,NULL,supplier_ids[2]),
    (v_user,'[massa] Pote 250 ml','pot',0.95,NULL,supplier_ids[2]),
    (v_user,'[massa] Forma marmita 500 ml','pot',1.10,NULL,supplier_ids[2]),
    (v_user,'[massa] Sacola personalizada','bag',2.40,NULL,supplier_ids[7]),
    (v_user,'[massa] Filme PVC','film',0.35,NULL,supplier_ids[2]),
    (v_user,'[massa] Etiqueta validade','label',0.18,NULL,supplier_ids[5]),
    (v_user,'[massa] Caixa kit festa','box',12.00,NULL,supplier_ids[7]);
  SELECT array_agg(id ORDER BY name) INTO packaging_ids FROM packaging WHERE user_id=v_user AND name LIKE '[massa]%';
  INSERT INTO product_packaging (product_id,packaging_id)
  SELECT product_ids[g.series_idx], packaging_ids[1 + ((g.series_idx-1) % array_length(packaging_ids,1))]
  FROM generate_series(1,array_length(product_ids,1)) AS g(series_idx);

  -- =============================== PRECIFICACAO ===================================
  FOR i IN 1..10 LOOP
    v_product := product_ids[i];
    INSERT INTO pricing_calculations
      (user_id,product_id,ingredient_cost,packaging_cost,labor_cost,fixed_cost_share,total_cost,margin_percent,suggested_price,fees_percent,fees_amount,final_price,created_at)
    VALUES
      (v_user,v_product,8+i*2,1.20+i*0.15,5+i,3.50,17.70+i*3.15,60,28.32+i*5.04,4.99,1.41+i*0.25,29.90+i*5.29,now()-i*interval '6 days');
  END LOOP;
  INSERT INTO pricing_preferences (user_id, channel_fees)
  VALUES (v_user, '[{"id":"ifood","name":"iFood","percent":23},{"id":"card","name":"Cartao","percent":4.99}]'::jsonb)
  ON CONFLICT (user_id) DO UPDATE
  SET channel_fees = EXCLUDED.channel_fees, updated_at = now();

  -- ================================= ROTULOS (8) ==================================
  FOR i IN 1..8 LOOP
    INSERT INTO labels (user_id,product_id,template_id,name,data,qr_code_url,created_at)
    VALUES (v_user,product_ids[i],CASE WHEN i%2=0 THEN 'minimalista' ELSE 'classico' END,
      '[massa] Rotulo ' || i,
      jsonb_build_object('brand','Delicias da Mariana','product',(SELECT name FROM products WHERE id=product_ids[i]),'validity','5 dias','ingredients','Produzido artesanalmente'),
      'https://catalogo.lucrocaseiro.com.br/c/mariana-vasconcelos-demo?produto=' || product_ids[i]::text || '#produto-' || product_ids[i]::text,
      now()-i*interval '4 days');
  END LOOP;

  -- ============================= VENDAS (72 / 6 MESES) ============================
  PERFORM setseed(0.4242);
  FOR i IN 1..72 LOOP
    v_product := product_ids[1 + ((i * 7) % 17)];
    SELECT sale_price INTO v_price FROM products WHERE id = v_product;
    v_qty := 1 + (i % 8);
    IF (SELECT sale_unit FROM products WHERE id=v_product) = 'kg' THEN v_qty := 0.5 + ((i % 5) * 0.5); END IF;
    v_total := round(v_price * v_qty,2);
    v_when := date_trunc('month',now()) - ((i % 6) * interval '1 month') + ((i * 3 % 25) * interval '1 day') + interval '11 hours';
    v_status := CASE WHEN i%13=0 THEN 'cancelled'::sale_status WHEN i%7=0 THEN 'pending'::sale_status ELSE 'paid'::sale_status END;
    v_payment := (ARRAY['pix','cash','card','credit','transfer']::payment_method[])[1+(i%5)];
    IF v_status='pending' THEN v_payment := 'credit'; END IF;
    INSERT INTO sales (user_id,client_id,status,payment_method,subtotal,total,paid_amount,notes,sold_at,created_at)
    VALUES (
      v_user,client_ids[1+(i%24)],v_status,v_payment,v_total,v_total,
      CASE WHEN v_status='paid' THEN v_total ELSE 0 END,
      '[massa]',v_when,v_when
    )
    RETURNING id INTO v_sale;
    INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,subtotal) VALUES (v_sale,v_product,v_qty,v_price,v_total);
    IF v_status='paid' THEN
      INSERT INTO finance_entries (user_id,type,category,amount,description,sale_id,date,created_at)
      VALUES (v_user,'income','sale',v_total,'[massa] Venda #'||lpad(i::text,3,'0'),v_sale,v_when::date,v_when);
    END IF;
  END LOOP;

  -- Atualiza gasto total dos clientes para ranking e detalhes.
  UPDATE clients c SET total_spent = s.total
  FROM (SELECT client_id,sum(total) total FROM sales WHERE user_id=v_user AND notes='[massa]' AND status='paid' GROUP BY client_id) s
  WHERE c.id=s.client_id;

  -- =========================== FINANCEIRO E RECORRENTES ===========================
  INSERT INTO recurring_expenses (user_id,category,amount,description,day_of_month,active) VALUES
    (v_user,'utility',180.00,'[massa] Energia eletrica',8,true),
    (v_user,'utility',109.90,'[massa] Internet',10,true),
    (v_user,'other',79.90,'[massa] Sistema e ferramentas',12,true),
    (v_user,'fee',65.00,'[massa] Contabilidade MEI',15,true),
    (v_user,'transport',120.00,'[massa] Entregador mensal',20,true),
    (v_user,'other',49.90,'[massa] Assinatura de design',25,false);

  INSERT INTO finance_entries (user_id,type,category,amount,description,is_fixed,date) VALUES
    (v_user,'expense','material',486.70,'[massa] Compra mensal de ingredientes',false,current_date-3),
    (v_user,'expense','packaging',238.40,'[massa] Reposicao de embalagens',false,current_date-7),
    (v_user,'expense','utility',180.00,'[massa] Energia eletrica',true,current_date-10),
    (v_user,'expense','transport',96.00,'[massa] Entregas por aplicativo',false,current_date-5),
    (v_user,'expense','fee',74.30,'[massa] Taxas de cartao',false,current_date-12),
    (v_user,'expense','other',159.90,'[massa] Anuncio nas redes sociais',false,current_date-18),
    (v_user,'income','other',250.00,'[massa] Oficina de confeitaria',false,current_date-9),
    (v_user,'expense','material',395.20,'[massa] Ingredientes mes anterior',false,current_date-38),
    (v_user,'expense','packaging',184.50,'[massa] Embalagens mes anterior',false,current_date-42),
    (v_user,'expense','utility',180.00,'[massa] Energia mes anterior',true,current_date-40);

  -- ============================== COMPRAS (14) ====================================
  FOR i IN 1..14 LOOP
    IF i%3=0 THEN
      INSERT INTO finance_entries (user_id,type,category,amount,description,is_fixed,date)
      VALUES (v_user,'expense',(CASE WHEN i%2=0 THEN 'packaging' ELSE 'material' END)::expense_category,70+i*18,'[massa] Pagamento fornecedor #'||i,false,current_date-(i*3))
      RETURNING id INTO v_finance;
      INSERT INTO purchases (user_id,supplier_id,description,amount,category,payment_status,purchased_at,due_date,paid_at,finance_entry_id)
      VALUES (v_user,supplier_ids[1+(i%8)],'[massa] Pedido fornecedor #'||i,70+i*18,(CASE WHEN i%2=0 THEN 'packaging' ELSE 'material' END)::expense_category,'paid',current_date-(i*3),current_date-(i*3)+7,current_date-(i*3)+5,v_finance);
      SELECT id INTO v_purchase FROM purchases
      WHERE user_id=v_user AND description='[massa] Pedido fornecedor #'||i;
    ELSE
      INSERT INTO purchases (user_id,supplier_id,description,amount,category,payment_status,purchased_at,due_date)
      VALUES (v_user,supplier_ids[1+(i%8)],'[massa] Pedido fornecedor #'||i,70+i*18,(CASE WHEN i%2=0 THEN 'packaging' ELSE 'material' END)::expense_category,'pending',current_date-(i*2),current_date+(i%10)+1)
      RETURNING id INTO v_purchase;
    END IF;
    INSERT INTO purchase_items (purchase_id,product_id,product_name,quantity,unit_cost,subtotal)
    SELECT v_purchase,p.id,p.name,2,round((70+i*18)::numeric/2,2),70+i*18
    FROM products p WHERE p.id=product_ids[1+(i%10)];
  END LOOP;

  -- ============================ SERVICOS E PACOTES =============================
  INSERT INTO services
    (user_id,name,description,duration_minutes,default_price,material_cost,hourly_rate,other_cost,fixed_cost_share,markup_percent,fees_percent,location_mode,buffer_minutes,public_enabled,booking_instructions,active)
  VALUES
    (v_user,'[massa] Bolo personalizado','Planejamento, producao e acabamento de bolo tematico.',180,280,72,45,18,22,55,4.99,'business',30,true,'Enviar tema e quantidade de convidados.',true),
    (v_user,'[massa] Oficina de brigadeiros','Aula pratica para pequenos grupos.',120,190,38,50,12,20,45,4.99,'business',20,true,'Confirmar numero de participantes.',true),
    (v_user,'[massa] Consultoria de cardapio','Revisao de custos, mix e precos do cardapio.',90,150,0,70,10,15,35,3.50,'online',15,true,'Enviar cardapio atual antes do encontro.',true),
    (v_user,'[massa] Montagem de mesa','Servico pausado para eventos.',240,NULL,95,40,25,30,50,4.99,'client',60,false,NULL,false);
  SELECT array_agg(id ORDER BY name) INTO service_ids
  FROM services WHERE user_id = v_user AND name LIKE '[massa]%';

  v_service := service_ids[1];
  INSERT INTO service_variations (user_id,service_id,name,duration_minutes,price) VALUES
    (v_user,v_service,'[massa] Ate 20 pessoas',150,240),
    (v_user,v_service,'[massa] Ate 50 pessoas',240,420);
  INSERT INTO service_add_ons (user_id,service_id,name,duration_minutes,price) VALUES
    (v_user,v_service,'[massa] Topo personalizado',20,45),
    (v_user,v_service,'[massa] Entrega expressa',30,35);
  INSERT INTO service_packages (user_id,service_id,name,sessions,price,validity_days,recurrence_days)
  VALUES (v_user,v_service,'[massa] Pacote 4 celebracoes',4,840,365,30)
  RETURNING id INTO v_service_package;
  INSERT INTO service_package_purchases
    (user_id,package_id,service_id,client_id,sessions_total,sessions_used,price_paid,purchased_at,expires_at,status)
  VALUES
    (v_user,v_service_package,v_service,client_ids[1],4,1,840,now()-interval '20 days',current_date+345,'active')
  RETURNING id INTO v_service_purchase;
  INSERT INTO public_service_booking_requests
    (user_id,service_id,service_name,client_name,phone,desired_date,desired_time,location_mode,notes,status)
  VALUES
    (v_user,v_service,'[massa] Bolo personalizado','Beatriz Almeida','11995550101',current_date+8,'14:00','business','[massa] Tema jardim, 30 convidados','new'),
    (v_user,service_ids[2],'[massa] Consultoria de cardapio','Luciana Prado','11995550102',current_date+12,'10:00','online','[massa] Quer revisar precos','contacted');

  FOR i IN 1..6 LOOP
    INSERT INTO orders
      (user_id,client_id,title,delivery_date,delivery_time,status,amount,deposit,notes,service_id,duration_minutes,appointment_status,location_mode,location_details,actual_cost,completed_at,service_package_purchase_id)
    VALUES
      (v_user,client_ids[1+(i%24)],'[massa] Atendimento #'||i,current_date+(i-2),lpad((9+i)::text,2,'0')||':00','pending',120+i*25,
       CASE WHEN i%2=0 THEN 120+i*25 ELSE round((120+i*25)*0.5,2) END,'[massa] Atendimento de demonstracao',service_ids[1+(i%4)],60+(i*15),
       (ARRAY['scheduled','confirmed','in_progress','completed','cancelled','no_show'])[i],
       (ARRAY['business','client','online'])[1+(i%3)],'Detalhes combinados pelo WhatsApp',45+i*8,
       CASE WHEN i=4 THEN now()-interval '2 days' ELSE NULL END,
       CASE WHEN i=1 THEN v_service_purchase ELSE NULL END);
  END LOOP;

  -- ======================== ESTOQUE E PRODUCAO RASTREADOS =======================
  FOR i IN 1..12 LOOP
    INSERT INTO stock_movements (user_id,product_id,type,delta,balance_after,reason,occurred_at)
    VALUES (
      v_user,product_ids[1+(i%10)],
      (ARRAY['purchase','sale','adjustment','production'])[1+(i%4)],
      CASE WHEN i%3=0 THEN -2 ELSE 5 END,
      20+i,
      '[massa] Movimento de demonstracao #'||i,
      now()-i*interval '2 days'
    );
  END LOOP;
  FOR i IN 1..4 LOOP
    INSERT INTO production_runs
      (user_id,product_id,recipe_id,planned_quantity,produced_quantity,planned_cost,actual_cost,waste_cost,status,notes,created_at,closed_at)
    VALUES
      (v_user,product_ids[i],recipe_ids[i],40+i*10,38+i*10,80+i*15,84+i*16,4+i,'closed','[massa] Lote de demonstracao #'||i,now()-i*interval '9 days',now()-i*interval '9 days'+interval '4 hours')
    RETURNING id INTO v_production;
    INSERT INTO production_run_items
      (production_run_id,material_id,planned_quantity,actual_quantity,waste_quantity,unit_cost)
    VALUES
      (v_production,material_ids[i],4,4.2,0.2,5.80+i),
      (v_production,material_ids[i+1],2,2.1,0.1,6.20+i);
  END LOOP;

  -- =============================== AGENDA (18) ====================================
  FOR i IN 1..18 LOOP
    INSERT INTO orders (user_id,client_id,title,delivery_date,delivery_time,status,amount,deposit,theme,honoree,colors,notes)
    VALUES (v_user,client_ids[1+(i%24)],'[massa] ' || (ARRAY['Bolo de aniversario','Kit festa completo','Torta de morango','Caixas de brigadeiros','Marmitas da semana','Doces para casamento'])[1+(i%6)],
      current_date + (i-5),lpad((9+(i%9))::text,2,'0')||':00',
      (ARRAY['pending','in_production','ready','done','cancelled']::order_status[])[1+(i%5)],
      90+i*35,CASE WHEN i%4=0 THEN 90+i*35 ELSE round((90+i*35)*0.5,2) END,
      (ARRAY['Jardim','Safari','Princesas','Minimalista','Fazendinha','Floral'])[1+(i%6)],
      (ARRAY['Alice','Theo','Sofia','Miguel','Helena','Arthur'])[1+(i%6)],
      (ARRAY['rosa e dourado','verde e bege','azul e branco','terracota','lilas e prata','colorido'])[1+(i%6)],
      'Demonstracao completa da agenda');
  END LOOP;

  -- ============================== ORCAMENTOS (12) =================================
  FOR i IN 1..12 LOOP
    IF i%4=0 THEN
      INSERT INTO orders (user_id,client_id,title,delivery_date,status,amount,deposit,notes)
      VALUES (v_user,client_ids[1+(i%24)],'[massa] Pedido aprovado #'||i,current_date+i+10,'pending',250+i*30,(250+i*30)*0.5,'Convertido de orcamento')
      RETURNING id INTO v_order;
    ELSE v_order := NULL;
    END IF;
    INSERT INTO quotes (user_id,client_id,title,items,subtotal,total,status,valid_until,notes,order_id,created_at,updated_at)
    VALUES (v_user,client_ids[1+(i%24)],'[massa] Orcamento evento #'||i,
      jsonb_build_array(
        jsonb_build_object('description','Bolo personalizado','quantity',1,'unitPrice',120+i*5),
        jsonb_build_object('description','Doces gourmet','quantity',50+i*5,'unitPrice',4.5),
        jsonb_build_object('description','Entrega','quantity',1,'unitPrice',25)
      ),370+i*27.5,370+i*27.5,
      CASE WHEN i%4=0 THEN 'accepted' WHEN i%4=2 THEN 'rejected' ELSE 'pending' END,
      current_date+i+7,'Proposta detalhada enviada pelo WhatsApp',v_order,now()-i*interval '5 days',now()-i*interval '4 days');
  END LOOP;

  -- =============================== OPERACAO / PDV ===============================
  INSERT INTO retail_documents
    (user_id,kind,status,title,party_id,amount,deposit,due_at,reserved_until,payload,created_at,updated_at)
  VALUES
    (v_user,'cash_session','open','[massa] Caixa de hoje',NULL,150,150,NULL,NULL,'{"openingFloat":150,"note":"Caixa de demonstracao"}'::jsonb,now()-interval '4 hours',now()),
    (v_user,'school_list','active','[massa] Lista escolar Colegio Horizonte',client_ids[2],680,200,current_date+15,NULL,'{"student":"Laura","grade":"5o ano"}'::jsonb,now()-interval '8 days',now()-interval '1 day'),
    (v_user,'inventory_count','counting','[massa] Contagem de estoque agosto',NULL,0,0,current_date+2,NULL,'{"section":"Estoque principal"}'::jsonb,now()-interval '2 days',now()),
    (v_user,'purchase_order','sent','[massa] Reposicao de embalagens',NULL,420,0,current_date+7,NULL,'{"supplier":"Embalagens Bella"}'::jsonb,now()-interval '6 days',now()-interval '3 days'),
    (v_user,'service_order','production','[massa] Identidade visual festa',client_ids[3],540,270,current_date+9,NULL,'{"briefing":"Tema floral rosa e dourado"}'::jsonb,now()-interval '10 days',now()),
    (v_user,'catalog_order','ready','[massa] Pedido catalogo Gabriela',client_ids[4],186,93,current_date+1,now()+interval '1 day','{"fulfillment":"pickup","customerPhone":"11990001004"}'::jsonb,now()-interval '3 days',now()),
    (v_user,'fiscal_document','authorized','[massa] NFC-e venda demonstracao',client_ids[5],128,128,NULL,NULL,'{"type":"nfce","provider":"demonstracao"}'::jsonb,now()-interval '1 day',now());

  INSERT INTO retail_document_items
    (document_id,product_id,name,quantity,unit_price,subtotal,metadata)
  SELECT d.id,p.id,p.name,g.n,p.sale_price,round(p.sale_price*g.n,2),jsonb_build_object('seed','[massa]')
  FROM retail_documents d
  CROSS JOIN generate_series(1,2) AS g(n)
  JOIN products p ON p.id=product_ids[1+((g.n + CASE d.kind
    WHEN 'school_list' THEN 1 WHEN 'inventory_count' THEN 3 WHEN 'purchase_order' THEN 5
    WHEN 'service_order' THEN 7 WHEN 'catalog_order' THEN 9 ELSE 2 END) % 10)]
  WHERE d.user_id=v_user AND d.title LIKE '[massa]%' AND d.kind <> 'cash_session';

  SELECT id INTO v_retail_document FROM retail_documents
  WHERE user_id=v_user AND title='[massa] Caixa de hoje';
  INSERT INTO retail_cash_movements (session_id,type,payment_method,amount,note,created_at) VALUES
    (v_retail_document,'supply','cash',150,'[massa] Fundo de caixa',now()-interval '4 hours'),
    (v_retail_document,'sale','pix',186,'[massa] Venda no PDV',now()-interval '2 hours'),
    (v_retail_document,'sale','card',128,'[massa] Venda no cartao',now()-interval '1 hour'),
    (v_retail_document,'withdrawal','cash',40,'[massa] Pequena retirada',now()-interval '30 minutes');

  INSERT INTO retail_promotions
    (user_id,name,type,value,buy_quantity,pay_quantity,product_id,category,starts_at,ends_at,active)
  VALUES
    (v_user,'[massa] 10% em doces','percentage',10,NULL,NULL,NULL,'Doces',now()-interval '7 days',now()+interval '21 days',true),
    (v_user,'[massa] Leve 3 pague 2','buy_x_pay_y',1,3,2,product_ids[1],NULL,now()-interval '2 days',now()+interval '12 days',true),
    (v_user,'[massa] Desconto sazonal','fixed',3,NULL,NULL,product_ids[4],NULL,now()-interval '30 days',now()-interval '2 days',false);
  INSERT INTO retail_business_accounts
    (user_id,client_id,kind,legal_name,document,contact_name,credit_limit,used_credit,due_days,discount_percent,active)
  VALUES
    (v_user,client_ids[5],'company','[massa] Empresa Horizonte','12.345.678/0001-90','Paula Andrade',2500,680,30,8,true),
    (v_user,client_ids[6],'school','[massa] Colegio Primavera','98.765.432/0001-10','Fernanda Lima',4000,1120,45,10,true);
  FOR i IN 1..6 LOOP
    INSERT INTO retail_price_changes (user_id,product_id,previous_price,new_price,reason,created_at)
    SELECT v_user,p.id,p.sale_price-2,p.sale_price,'[massa] Reajuste de custos #'||i,now()-i*interval '12 days'
    FROM products p WHERE p.id=product_ids[i];
  END LOOP;

  -- ================================= METAS ========================================
  INSERT INTO business_goals (user_id,monthly_prolabore_goal,estimated_monthly_costs,avg_ticket_override)
  VALUES (v_user,5000.00,2850.00,95.00);

  -- ================================ CATALOGO ======================================
  INSERT INTO catalog_settings
    (user_id,slug,enabled,whatsapp,accent_color,pattern,tagline,promo_banner,service_tagline,service_promo_banner)
  VALUES
    (v_user,'mariana-vasconcelos-demo',true,'5511987654321','#C96F82','confetti','Doces feitos com carinho para transformar seus momentos.','Encomendas abertas para este mes!','Servicos personalizados para celebrar e organizar seu negocio.','Agenda de atendimentos aberta para este mes!');

  RAISE NOTICE 'Massa completa criada para %: 24 clientes, 8 fornecedores, 16 insumos, 8 receitas, 18 produtos, 8 embalagens, 4 servicos, 72 vendas, 27 encomendas, 12 orcamentos, 14 compras, operacao/PDV e dados avancados.', v_user;
END $$;

-- Conferencia rapida apos executar:
SELECT
  u.email,
  u.plan,
  (SELECT count(*) FROM clients c WHERE c.user_id=u.id AND c.notes LIKE '[massa]%') AS clientes,
  (SELECT count(*) FROM products p WHERE p.user_id=u.id AND p.name LIKE '[massa]%') AS produtos,
  (SELECT count(*) FROM sales s WHERE s.user_id=u.id AND s.notes='[massa]') AS vendas,
  (SELECT count(*) FROM orders o WHERE o.user_id=u.id AND o.title LIKE '[massa]%') AS encomendas,
  (SELECT count(*) FROM quotes q WHERE q.user_id=u.id AND q.title LIKE '[massa]%') AS orcamentos,
  (SELECT count(*) FROM materials m WHERE m.user_id=u.id AND m.name LIKE '[massa]%') AS insumos,
  (SELECT count(*) FROM recipes r WHERE r.user_id=u.id AND r.name LIKE '[massa]%') AS receitas,
  (SELECT count(*) FROM suppliers s WHERE s.user_id=u.id AND s.notes='[massa]') AS fornecedores,
  (SELECT count(*) FROM purchases p WHERE p.user_id=u.id AND p.description LIKE '[massa]%') AS compras
  ,(SELECT count(*) FROM services s WHERE s.user_id=u.id AND s.name LIKE '[massa]%') AS servicos
  ,(SELECT count(*) FROM retail_documents d WHERE d.user_id=u.id AND d.title LIKE '[massa]%') AS documentos_operacionais
  ,(SELECT count(*) FROM production_runs pr WHERE pr.user_id=u.id AND pr.notes LIKE '[massa]%') AS lotes_producao
FROM public.users u
WHERE lower(u.email)=lower(COALESCE(NULLIF(current_setting('app.seed_email', true), ''), 'marianadosreisvasconcelos7@gmail.com'));
