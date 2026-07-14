import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.includes("<") || databaseUrl.includes(">")) {
  throw new Error(
    "DATABASE_URL real não configurada; substitua os placeholders do apps/api/.env para consultar as métricas",
  );
}

const db = postgres(databaseUrl, { max: 1, prepare: false });

try {
  const [metrics] = await db`
    WITH activation_events AS (
      SELECT user_id, created_at AS activated_at
      FROM pricing_calculations
      UNION ALL
      SELECT user_id, created_at AS activated_at
      FROM sales
      WHERE status != 'cancelled'
      UNION ALL
      SELECT user_id, created_at AS activated_at
      FROM orders
      WHERE status != 'cancelled'
    ),
    first_activation AS (
      SELECT user_id, MIN(activated_at) AS activated_at
      FROM activation_events
      GROUP BY user_id
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
      ROUND(100.0 * retained.retained_d30 / NULLIF(retained.eligible_d30, 0), 2) AS retention_d30_percent
    FROM overview, signups, active, active_users, retained
  `;

  console.warn(JSON.stringify(metrics, null, 2));
} finally {
  await db.end();
}
