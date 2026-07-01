-- Fecha a corrida de duplicidade de clientes por telefone.
-- Antes de criar o indice unico, consolida duplicados existentes no cliente
-- mais antigo e move historico para ele.

WITH ranked_clients AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY
        user_id,
        CASE
          WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
            AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
          THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
          ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
        END
      ORDER BY created_at ASC, id ASC
    ) AS keep_id,
    row_number() OVER (
      PARTITION BY
        user_id,
        CASE
          WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
            AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
          THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
          ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
        END
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM clients
  WHERE (
    CASE
      WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
        AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
      THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
      ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
    END
  ) <> ''
),
duplicate_clients AS (
  SELECT id, keep_id
  FROM ranked_clients
  WHERE rn > 1
)
UPDATE sales
SET client_id = duplicate_clients.keep_id
FROM duplicate_clients
WHERE sales.client_id = duplicate_clients.id;

WITH ranked_clients AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY
        user_id,
        CASE
          WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
            AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
          THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
          ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
        END
      ORDER BY created_at ASC, id ASC
    ) AS keep_id,
    row_number() OVER (
      PARTITION BY
        user_id,
        CASE
          WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
            AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
          THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
          ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
        END
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM clients
  WHERE (
    CASE
      WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
        AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
      THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
      ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
    END
  ) <> ''
),
duplicate_clients AS (
  SELECT id, keep_id
  FROM ranked_clients
  WHERE rn > 1
)
UPDATE orders
SET client_id = duplicate_clients.keep_id
FROM duplicate_clients
WHERE orders.client_id = duplicate_clients.id;

WITH ranked_clients AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY
        user_id,
        CASE
          WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
            AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
          THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
          ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
        END
      ORDER BY created_at ASC, id ASC
    ) AS keep_id,
    row_number() OVER (
      PARTITION BY
        user_id,
        CASE
          WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
            AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
          THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
          ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
        END
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM clients
  WHERE (
    CASE
      WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
        AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
      THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
      ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
    END
  ) <> ''
),
duplicate_clients AS (
  SELECT id, keep_id
  FROM ranked_clients
  WHERE rn > 1
)
UPDATE quotes
SET client_id = duplicate_clients.keep_id
FROM duplicate_clients
WHERE quotes.client_id = duplicate_clients.id;

WITH ranked_clients AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY
        user_id,
        CASE
          WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
            AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
          THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
          ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
        END
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM clients
  WHERE (
    CASE
      WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
        AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
      THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
      ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
    END
  ) <> ''
)
DELETE FROM clients
USING ranked_clients
WHERE clients.id = ranked_clients.id
  AND ranked_clients.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_phone_digits_unique
ON clients (
  user_id,
  (
    CASE
      WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
        AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
      THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
      ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
    END
  )
)
WHERE (
  CASE
    WHEN length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) IN (12, 13)
      AND left(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 2) = '55'
    THEN substring(regexp_replace(coalesce(phone, ''), '\D', '', 'g') FROM 3)
    ELSE regexp_replace(coalesce(phone, ''), '\D', '', 'g')
  END
) <> '';
