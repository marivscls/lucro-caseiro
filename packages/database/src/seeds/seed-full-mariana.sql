-- Massa completa para TODAS as telas do Lucro Caseiro.
-- Conta: marianadosreisvasconcelos7@gmail.com
-- Execute no SQL Editor do Supabase. Idempotente: remove apenas dados [massa] desta conta.
-- ATENCAO: promove a conta para o plano professional para liberar os recursos avancados.

DO $$
DECLARE
  v_user uuid;
  v_sale uuid;
  v_finance uuid;
  v_order uuid;
  v_product uuid;
  v_recipe uuid;
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
  i integer;
BEGIN
  SELECT id INTO v_user
  FROM public.users
  WHERE lower(email) = lower('marianadosreisvasconcelos7@gmail.com');

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuario marianadosreisvasconcelos7@gmail.com nao encontrado em public.users';
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
  DELETE FROM labels WHERE user_id = v_user AND name LIKE '[massa]%';
  DELETE FROM pricing_calculations WHERE user_id = v_user
    AND product_id IN (SELECT id FROM products WHERE user_id = v_user AND name LIKE '[massa]%');
  DELETE FROM quotes WHERE user_id = v_user AND title LIKE '[massa]%';
  DELETE FROM orders WHERE user_id = v_user AND title LIKE '[massa]%';
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

  -- ================================= ROTULOS (8) ==================================
  FOR i IN 1..8 LOOP
    INSERT INTO labels (user_id,product_id,template_id,name,data,qr_code_url,created_at)
    VALUES (v_user,product_ids[i],CASE WHEN i%2=0 THEN 'minimalista' ELSE 'classico' END,
      '[massa] Rotulo ' || i,
      jsonb_build_object('brand','Delicias da Mariana','product',(SELECT name FROM products WHERE id=product_ids[i]),'validity','5 dias','ingredients','Produzido artesanalmente'),
      'https://catalogo.lucrocaseiro.com.br/c/mariana-demo?produto=' || product_ids[i]::text || '#produto-' || product_ids[i]::text,
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
    INSERT INTO sales (user_id,client_id,status,payment_method,total,notes,sold_at,created_at)
    VALUES (v_user,client_ids[1+(i%24)],v_status,v_payment,v_total,'[massa]',v_when,v_when)
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
    ELSE
      INSERT INTO purchases (user_id,supplier_id,description,amount,category,payment_status,purchased_at,due_date)
      VALUES (v_user,supplier_ids[1+(i%8)],'[massa] Pedido fornecedor #'||i,70+i*18,(CASE WHEN i%2=0 THEN 'packaging' ELSE 'material' END)::expense_category,'pending',current_date-(i*2),current_date+(i%10)+1);
    END IF;
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
    INSERT INTO quotes (user_id,client_id,title,items,total,status,valid_until,notes,order_id,created_at,updated_at)
    VALUES (v_user,client_ids[1+(i%24)],'[massa] Orcamento evento #'||i,
      jsonb_build_array(
        jsonb_build_object('description','Bolo personalizado','quantity',1,'unitPrice',120+i*5),
        jsonb_build_object('description','Doces gourmet','quantity',50+i*5,'unitPrice',4.5),
        jsonb_build_object('description','Entrega','quantity',1,'unitPrice',25)
      ),370+i*32,
      CASE WHEN i%4=0 THEN 'accepted' WHEN i%4=2 THEN 'rejected' ELSE 'pending' END,
      current_date+i+7,'Proposta detalhada enviada pelo WhatsApp',v_order,now()-i*interval '5 days',now()-i*interval '4 days');
  END LOOP;

  -- ================================= METAS ========================================
  INSERT INTO business_goals (user_id,monthly_prolabore_goal,estimated_monthly_costs,avg_ticket_override)
  VALUES (v_user,5000.00,2850.00,95.00);

  -- ================================ CATALOGO ======================================
  INSERT INTO catalog_settings (user_id,slug,enabled,whatsapp,accent_color,pattern,tagline,promo_banner)
  VALUES (v_user,'mariana-vasconcelos-demo',true,'5511987654321','#C96F82','confetti','Doces feitos com carinho para transformar seus momentos.','Encomendas abertas para este mes!');

  RAISE NOTICE 'Massa completa criada para %: 24 clientes, 8 fornecedores, 16 insumos, 8 receitas, 18 produtos, 8 embalagens, 72 vendas, 18 encomendas, 12 orcamentos, 14 compras e dados avancados.', v_user;
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
FROM public.users u
WHERE lower(u.email)=lower('marianadosreisvasconcelos7@gmail.com');
