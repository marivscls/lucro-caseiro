export const ANALYTICS_DASHBOARD_QUERY = `
  WITH first_pricing AS (
    SELECT user_id, MIN(occurred_at) AS pricing_at
    FROM analytics_events
    WHERE user_id IS NOT NULL
      AND event_type = 'action'
      AND event_name = 'pricing_completed'
    GROUP BY user_id
  ),
  first_priced_product AS (
    SELECT pricing.user_id, MIN(event.occurred_at) AS product_at
    FROM first_pricing pricing
    JOIN analytics_events event
      ON event.user_id = pricing.user_id
      AND event.event_type = 'action'
      AND event.event_name = 'product_created_from_pricing'
      AND event.occurred_at >= pricing.pricing_at
    GROUP BY pricing.user_id
  ),
  first_activation AS (
    SELECT product.user_id, MIN(event.occurred_at) AS activated_at
    FROM first_priced_product product
    JOIN analytics_events event
      ON event.user_id = product.user_id
      AND event.event_type = 'action'
      AND event.event_name IN ('catalog_published', 'sale_completed')
      AND event.occurred_at >= product.product_at
    GROUP BY product.user_id
  ),
  retention AS (
    SELECT
      installation.id,
      (installation.first_opened_at AT TIME ZONE 'UTC')::date AS cohort_date,
      EXISTS (
        SELECT 1 FROM analytics_activity_days activity
        WHERE activity.installation_id = installation.id
          AND activity.activity_date = (installation.first_opened_at AT TIME ZONE 'UTC')::date + 1
      ) AS retained_d1,
      EXISTS (
        SELECT 1 FROM analytics_activity_days activity
        WHERE activity.installation_id = installation.id
          AND activity.activity_date = (installation.first_opened_at AT TIME ZONE 'UTC')::date + 7
      ) AS retained_d7,
      EXISTS (
        SELECT 1 FROM analytics_activity_days activity
        WHERE activity.installation_id = installation.id
          AND activity.activity_date = (installation.first_opened_at AT TIME ZONE 'UTC')::date + 30
      ) AS retained_d30
    FROM analytics_installations installation
  ),
  overview AS (
    SELECT
      COUNT(DISTINCT installation.id)::int AS installations_total,
      COUNT(DISTINCT installation.id) FILTER (WHERE installation.first_opened_at >= NOW() - INTERVAL '7 days')::int AS installations_7d,
      COUNT(DISTINCT installation.id) FILTER (WHERE installation.first_opened_at >= NOW() - INTERVAL '30 days')::int AS installations_30d,
      COUNT(DISTINCT linked.installation_id)::int AS linked_installations
    FROM analytics_installations installation
    LEFT JOIN analytics_installation_users linked ON linked.installation_id = installation.id
  ),
  signups AS (
    SELECT
      COUNT(*)::int AS signups_total,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS signups_30d,
      COUNT(activation.user_id)::int AS activated_users_total,
      COUNT(*) FILTER (WHERE users.created_at <= NOW() - INTERVAL '7 days')::int AS eligible_activation_7d,
      COUNT(*) FILTER (
        WHERE users.created_at <= NOW() - INTERVAL '7 days'
          AND activation.activated_at <= users.created_at + INTERVAL '7 days'
      )::int AS activated_within_7d
    FROM users
    LEFT JOIN first_activation activation ON activation.user_id = users.id
  ),
  active AS (
    SELECT
      COUNT(DISTINCT installation_id) FILTER (WHERE activity_date = (NOW() AT TIME ZONE 'UTC')::date)::int AS active_installations_1d,
      COUNT(DISTINCT installation_id) FILTER (WHERE activity_date >= (NOW() AT TIME ZONE 'UTC')::date - 6)::int AS active_installations_7d,
      COUNT(DISTINCT installation_id) FILTER (WHERE activity_date >= (NOW() AT TIME ZONE 'UTC')::date - 29)::int AS active_installations_30d
    FROM analytics_activity_days
  ),
  active_users AS (
    SELECT
      COUNT(DISTINCT user_id) FILTER (WHERE activity_date = (NOW() AT TIME ZONE 'UTC')::date)::int AS active_users_1d,
      COUNT(DISTINCT user_id) FILTER (WHERE activity_date >= (NOW() AT TIME ZONE 'UTC')::date - 6)::int AS active_users_7d,
      COUNT(DISTINCT user_id) FILTER (WHERE activity_date >= (NOW() AT TIME ZONE 'UTC')::date - 29)::int AS active_users_30d
    FROM analytics_user_activity_days
  ),
  retained AS (
    SELECT
      COUNT(*) FILTER (WHERE cohort_date <= (NOW() AT TIME ZONE 'UTC')::date - 1)::int AS eligible_d1,
      COUNT(*) FILTER (WHERE cohort_date <= (NOW() AT TIME ZONE 'UTC')::date - 1 AND retained_d1)::int AS retained_d1,
      COUNT(*) FILTER (WHERE cohort_date <= (NOW() AT TIME ZONE 'UTC')::date - 7)::int AS eligible_d7,
      COUNT(*) FILTER (WHERE cohort_date <= (NOW() AT TIME ZONE 'UTC')::date - 7 AND retained_d7)::int AS retained_d7,
      COUNT(*) FILTER (WHERE cohort_date <= (NOW() AT TIME ZONE 'UTC')::date - 30)::int AS eligible_d30,
      COUNT(*) FILTER (WHERE cohort_date <= (NOW() AT TIME ZONE 'UTC')::date - 30 AND retained_d30)::int AS retained_d30
    FROM retention
  ),
  screen_usage AS (
    SELECT
      event_name AS screen,
      COUNT(*)::int AS visits,
      COUNT(DISTINCT COALESCE(user_id::text, installation_id::text))::int AS people,
      ROUND(COALESCE(SUM(duration_ms), 0) / 60000.0, 2) AS active_minutes,
      ROUND(COALESCE(AVG(duration_ms), 0) / 1000.0, 2) AS average_active_seconds
    FROM analytics_events
    WHERE event_type = 'screen_view'
      AND occurred_at >= NOW() - INTERVAL '30 days'
    GROUP BY event_name
    ORDER BY active_minutes DESC, visits DESC
  ),
  action_names(action) AS (
    VALUES
      ('signup_completed'),
      ('pricing_started'),
      ('pricing_completed'),
      ('product_created'),
      ('product_created_from_pricing'),
      ('sale_completed'),
      ('order_created'),
      ('catalog_published'),
      ('catalog_shared'),
      ('quote_created'),
      ('quote_pdf_exported'),
      ('finance_entry_created'),
      ('plan_limit_reached'),
      ('paid_feature_requested'),
      ('subscription_started'),
      ('subscription_completed'),
      ('subscription_cancelled'),
      ('business_profile_completed'),
      ('business_profile_skipped'),
      ('plan_chosen'),
      ('purchase_result'),
      ('ad_impression'),
      ('app_crashed')
  ),
  action_counts AS (
    SELECT
      event_name AS action,
      COUNT(*)::int AS events,
      COUNT(DISTINCT COALESCE(user_id::text, installation_id::text))::int AS people
    FROM analytics_events
    WHERE event_type = 'action'
      AND occurred_at >= NOW() - INTERVAL '30 days'
    GROUP BY event_name
  ),
  feature_usage AS (
    SELECT
      action_names.action,
      COALESCE(action_counts.events, 0)::int AS events,
      COALESCE(action_counts.people, 0)::int AS people
    FROM action_names
    LEFT JOIN action_counts USING (action)
    ORDER BY events DESC, action
  ),
  -- Cada etapa usa o primeiro marco a partir da etapa anterior. Conta criada vale pelo
  -- evento de cadastro ou pela primeira identificação da instalação (Google, login),
  -- e produto vale qualquer que seja a origem do cadastro.
  signup_candidates AS (
    SELECT
      installation.id,
      installation.first_opened_at,
      LEAST(
        (
          SELECT MIN(event.occurred_at)
          FROM analytics_events event
          WHERE event.installation_id = installation.id
            AND event.event_type = 'action'
            AND event.event_name = 'signup_completed'
        ),
        (
          SELECT MIN(linked.first_identified_at)
          FROM analytics_installation_users linked
          WHERE linked.installation_id = installation.id
        )
      ) AS signup_at
    FROM analytics_installations installation
  ),
  signup_milestones AS (
    SELECT id, CASE WHEN signup_at >= first_opened_at THEN signup_at END AS valid_signup
    FROM signup_candidates
  ),
  pricing_milestones AS (
    SELECT milestone.*, (
      SELECT MIN(event.occurred_at)
      FROM analytics_events event
      WHERE event.installation_id = milestone.id
        AND event.event_type = 'action'
        AND event.event_name = 'pricing_completed'
        AND event.occurred_at >= milestone.valid_signup
    ) AS valid_pricing
    FROM signup_milestones milestone
  ),
  product_milestones AS (
    SELECT milestone.*, (
      SELECT MIN(event.occurred_at)
      FROM analytics_events event
      WHERE event.installation_id = milestone.id
        AND event.event_type = 'action'
        AND event.event_name IN ('product_created', 'product_created_from_pricing')
        AND event.occurred_at >= milestone.valid_pricing
    ) AS valid_product
    FROM pricing_milestones milestone
  ),
  ordered_milestones AS (
    SELECT milestone.*, (
      SELECT MIN(event.occurred_at)
      FROM analytics_events event
      WHERE event.installation_id = milestone.id
        AND event.event_type = 'action'
        AND event.event_name IN ('catalog_published', 'sale_completed')
        AND event.occurred_at >= milestone.valid_product
    ) AS valid_outcome
    FROM product_milestones milestone
  ),
  funnel_counts AS (
    SELECT
      COUNT(*)::int AS installation_count,
      COUNT(valid_signup)::int AS signup_count,
      COUNT(valid_pricing)::int AS pricing_count,
      COUNT(valid_product)::int AS product_count,
      COUNT(valid_outcome)::int AS outcome_count
    FROM ordered_milestones
  ),
  funnel_rows AS (
    SELECT 1 AS position, 'installation' AS stage, installation_count AS installations, NULL::numeric AS previous_stage_percent FROM funnel_counts
    UNION ALL
    SELECT 2, 'signup', signup_count, ROUND(100.0 * signup_count / NULLIF(installation_count, 0), 2) FROM funnel_counts
    UNION ALL
    SELECT 3, 'pricing', pricing_count, ROUND(100.0 * pricing_count / NULLIF(signup_count, 0), 2) FROM funnel_counts
    UNION ALL
    SELECT 4, 'product', product_count, ROUND(100.0 * product_count / NULLIF(pricing_count, 0), 2) FROM funnel_counts
    UNION ALL
    SELECT 5, 'catalog_or_sale', outcome_count, ROUND(100.0 * outcome_count / NULLIF(product_count, 0), 2) FROM funnel_counts
  ),
  latest_installation_versions AS (
    SELECT DISTINCT ON (installation_id)
      installation_id,
      app_version
    FROM analytics_activity_days
    WHERE activity_date >= (NOW() AT TIME ZONE 'UTC')::date - 29
    ORDER BY installation_id, activity_date DESC
  ),
  version_counts AS (
    SELECT app_version, COUNT(*)::int AS installations
    FROM latest_installation_versions
    GROUP BY app_version
  ),
  version_adoption AS (
    SELECT
      app_version,
      installations,
      ROUND(100.0 * installations / NULLIF(SUM(installations) OVER (), 0), 2) AS percent
    FROM version_counts
    ORDER BY installations DESC, app_version DESC
  ),
  acquisition_sources AS (
    SELECT
      installation.utm_source AS source,
      installation.utm_content AS content,
      COUNT(*)::int AS installations,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1
        FROM analytics_installation_users linked
        WHERE linked.installation_id = installation.id
      ))::int AS linked_to_user
    FROM analytics_installations installation
    WHERE installation.first_opened_at >= NOW() - INTERVAL '30 days'
    GROUP BY installation.utm_source, installation.utm_content
    ORDER BY installations DESC, source NULLS LAST, content NULLS LAST
    LIMIT 20
  ),
  behavior_names(behavior) AS (
    VALUES ('pricing_completed'), ('catalog_shared')
  ),
  behavior_retention AS (
    SELECT
      behavior_names.behavior,
      COUNT(*)::int AS eligible,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1
        FROM analytics_activity_days activity
        WHERE activity.installation_id = installation.id
          AND activity.activity_date = (installation.first_opened_at AT TIME ZONE 'UTC')::date + 7
      ))::int AS retained
    FROM behavior_names
    JOIN analytics_installations installation ON EXISTS (
      SELECT 1
      FROM analytics_events event
      WHERE event.installation_id = installation.id
        AND event.event_type = 'action'
        AND event.event_name = behavior_names.behavior
        AND event.occurred_at >= installation.first_opened_at
        AND event.occurred_at <= installation.first_opened_at + INTERVAL '7 days'
    )
    WHERE installation.first_opened_at <= NOW() - INTERVAL '7 days'
    GROUP BY behavior_names.behavior
  ),
  behavior_retention_rows AS (
    SELECT
      behavior_names.behavior,
      COALESCE(behavior_retention.eligible, 0)::int AS eligible,
      COALESCE(behavior_retention.retained, 0)::int AS retained,
      ROUND(
        100.0 * behavior_retention.retained / NULLIF(behavior_retention.eligible, 0),
        2
      ) AS percent
    FROM behavior_names
    LEFT JOIN behavior_retention USING (behavior)
  )
  SELECT
    NOW() AS generated_at,
    overview.*,
    signups.signups_total,
    signups.signups_30d,
    signups.activated_users_total,
    signups.eligible_activation_7d,
    signups.activated_within_7d,
    ROUND(100.0 * signups.activated_within_7d / NULLIF(signups.eligible_activation_7d, 0), 2) AS activation_rate_7d_percent,
    active.*,
    active_users.*,
    retained.eligible_d1,
    retained.retained_d1,
    ROUND(100.0 * retained.retained_d1 / NULLIF(retained.eligible_d1, 0), 2) AS retention_d1_percent,
    retained.eligible_d7,
    retained.retained_d7,
    ROUND(100.0 * retained.retained_d7 / NULLIF(retained.eligible_d7, 0), 2) AS retention_d7_percent,
    retained.eligible_d30,
    retained.retained_d30,
    ROUND(100.0 * retained.retained_d30 / NULLIF(retained.eligible_d30, 0), 2) AS retention_d30_percent,
    COALESCE((SELECT jsonb_agg(to_jsonb(screen_usage)) FROM screen_usage), '[]'::jsonb) AS screen_usage,
    COALESCE((SELECT jsonb_agg(to_jsonb(feature_usage)) FROM feature_usage), '[]'::jsonb) AS feature_usage,
    COALESCE((SELECT jsonb_agg(to_jsonb(funnel_rows) - 'position' ORDER BY position) FROM funnel_rows), '[]'::jsonb) AS funnel,
    COALESCE((SELECT jsonb_agg(to_jsonb(version_adoption)) FROM version_adoption), '[]'::jsonb) AS version_adoption,
    COALESCE((SELECT jsonb_agg(to_jsonb(behavior_retention_rows)) FROM behavior_retention_rows), '[]'::jsonb) AS behavior_retention,
    COALESCE((
      SELECT jsonb_agg(to_jsonb(acquisition_sources)
        ORDER BY installations DESC, source NULLS LAST, content NULLS LAST)
      FROM acquisition_sources
    ), '[]'::jsonb) AS acquisition_sources
  FROM overview, signups, active, active_users, retained
`;
