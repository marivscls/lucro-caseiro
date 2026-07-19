-- Massa idempotente de etiquetas simples para a conta de demonstracao da Mariana.
-- Nao cria tabela nutricional nem simula rotulagem tecnica.

DO $$
DECLARE
  v_user uuid;
  v_business text;
  v_phone text;
  v_slug text;
  v_item jsonb;
  v_product uuid;
  v_product_name text;
  v_index integer := 0;
BEGIN
  SELECT id, coalesce(nullif(business_name, ''), nullif(name, ''), 'Delicias da Mariana'), phone
  INTO v_user, v_business, v_phone
  FROM public.users
  WHERE lower(email) = lower('marianadosreisvasconcelos7@gmail.com');

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Conta marianadosreisvasconcelos7@gmail.com nao encontrada';
  END IF;

  SELECT slug INTO v_slug
  FROM catalog_settings
  WHERE user_id = v_user AND enabled = true;

  DELETE FROM labels
  WHERE user_id = v_user
    AND (
      name LIKE '[massa] Rotulo %'
      OR name LIKE '[massa rotulos] %'
      OR name LIKE '[massa etiquetas] %'
    );

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements($labels$
      [
        {"product":"[massa] Bolo de chocolate","template":"classico","note":"Feito com carinho","days":5,"qr":true},
        {"product":"[massa] Bolo de pote morango","template":"moderno","note":"Manter refrigerado","days":4,"qr":false},
        {"product":"[massa] Brigadeiro gourmet","template":"minimalista","note":"Sabor chocolate","days":7,"qr":false},
        {"product":"[massa] Brownie recheado","template":"artesanal","note":"Recheio de brigadeiro","days":6,"qr":true},
        {"product":"[massa] Torta de morango","template":"gourmet","note":"Manter refrigerada","days":3,"qr":false},
        {"product":"[massa] Coxinha cento","template":"classico","note":"Aquecer antes de servir","days":3,"qr":false},
        {"product":"[massa] Marmita fit","template":"moderno","note":"Manter refrigerada","days":3,"qr":true},
        {"product":"[massa] Mini bolo afetivo","template":"minimalista","note":"Uma lembranca especial","days":5,"qr":false},
        {"product":"[massa] Cupcake decorado","template":"artesanal","note":"Tema festa","days":4,"qr":false},
        {"product":"[massa] Pao de mel","template":"gourmet","note":"Cobertura de chocolate","days":10,"qr":true},
        {"product":"[massa] Torta salgada","template":"classico","note":"Aquecer antes de servir","days":4,"qr":false},
        {"product":"[massa] Caixa 6 brigadeiros","template":"moderno","note":"6 unidades sortidas","days":7,"qr":false}
      ]
    $labels$::jsonb)
  LOOP
    SELECT id, name INTO v_product, v_product_name
    FROM products
    WHERE user_id = v_user
      AND name = v_item->>'product'
      AND is_active = true
    LIMIT 1;

    IF v_product IS NULL THEN
      RAISE WARNING 'Produto nao encontrado: %', v_item->>'product';
      CONTINUE;
    END IF;

    v_index := v_index + 1;

    INSERT INTO labels (user_id, product_id, template_id, name, data, qr_code_url)
    VALUES (
      v_user,
      v_product,
      v_item->>'template',
      '[massa etiquetas] ' || replace(v_product_name, '[massa] ', ''),
      jsonb_strip_nulls(jsonb_build_object(
        'productName', v_product_name,
        'note', v_item->>'note',
        'manufacturingDate', to_char(current_date, 'YYYY-MM-DD'),
        'expirationDate', to_char(current_date + (v_item->>'days')::integer, 'YYYY-MM-DD'),
        'producerName', v_business,
        'producerPhone', v_phone
      )),
      CASE
        WHEN coalesce((v_item->>'qr')::boolean, false) AND v_slug IS NOT NULL
          THEN 'https://catalogo.lucrocaseiro.com.br/c/' || v_slug || '?produto=' || v_product || '#produto-' || v_product
        ELSE NULL
      END
    );
  END LOOP;

  RAISE NOTICE '% etiquetas de demonstracao criadas para %', v_index, v_user;
END $$;

SELECT l.name, l.template_id, l.data->>'productName' AS produto,
  l.data->>'note' AS observacao, l.qr_code_url IS NOT NULL AS possui_qr
FROM labels l
JOIN public.users u ON u.id = l.user_id
WHERE lower(u.email) = lower('marianadosreisvasconcelos7@gmail.com')
  AND l.name LIKE '[massa etiquetas] %'
ORDER BY l.created_at;
