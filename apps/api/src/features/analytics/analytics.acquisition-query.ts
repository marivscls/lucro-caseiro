import { sql } from "drizzle-orm";

export function acquisitionQuery(excludedUserIds: readonly string[], asOf = new Date()) {
  return sql`
    WITH settings AS (
      SELECT ${asOf.toISOString()}::timestamptz AS as_of,
        ${JSON.stringify(excludedUserIds)}::text::jsonb AS excluded
    ), accounts AS (
      SELECT account.id, account.created_at,
        (account.created_at AT TIME ZONE 'UTC')::date AS cohort_day,
        account.created_at <= settings.as_of - INTERVAL '7 days' AS eligible_7d
      FROM auth.users account, settings
      WHERE account.confirmed_at IS NOT NULL
        AND account.created_at >= settings.as_of - INTERVAL '90 days'
        AND account.created_at <= settings.as_of
        AND NOT (settings.excluded ? account.id::text)
    ), recorded_actions AS (
      SELECT user_id, 'product' AS action, created_at AS occurred_at FROM products
      UNION ALL SELECT user_id, 'pricing', created_at FROM pricing_calculations
      UNION ALL SELECT user_id, 'sale', created_at FROM sales
      UNION ALL SELECT user_id, 'order', created_at FROM orders
      UNION ALL
      SELECT user_id, CASE event_name
        WHEN 'product_created' THEN 'product'
        WHEN 'product_created_from_pricing' THEN 'product'
        WHEN 'pricing_completed' THEN 'pricing'
        WHEN 'sale_completed' THEN 'sale'
        ELSE 'other_value' END, occurred_at
      FROM analytics_events
      WHERE event_type = 'action' AND event_name IN (
        'product_created', 'product_created_from_pricing', 'pricing_completed',
        'sale_completed', 'order_created', 'catalog_content_published',
        'catalog_published', 'service_created', 'finance_entry_created', 'quote_created'
      )
    ), first_actions AS (
      SELECT account.id, action.action, MIN(action.occurred_at) AS occurred_at
      FROM accounts account JOIN recorded_actions action ON action.user_id = account.id
      CROSS JOIN settings
      WHERE action.occurred_at >= account.created_at
        AND action.occurred_at <= account.created_at + INTERVAL '7 days'
        AND action.occurred_at <= settings.as_of
      GROUP BY account.id, action.action
    ), milestones AS (
      SELECT * FROM first_actions
      UNION ALL SELECT id, 'first_value', MIN(occurred_at) FROM first_actions GROUP BY id
    ), milestone_names(action) AS (
      VALUES ('first_value'), ('product'), ('pricing'), ('sale')
    ), milestone_summary AS (
      SELECT name.action,
        COUNT(milestone.id)::int AS users,
        COUNT(account.id)::int AS eligible,
        ROUND(100.0 * COUNT(milestone.id) / NULLIF(COUNT(account.id), 0), 2) AS percent,
        ROUND((percentile_cont(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (milestone.occurred_at - account.created_at)) / 60.0
        ))::numeric, 1) AS "medianMinutes"
      FROM milestone_names name
      LEFT JOIN accounts account ON account.eligible_7d
      LEFT JOIN milestones milestone ON milestone.id = account.id AND milestone.action = name.action
      GROUP BY name.action
    ), retention_windows AS (
      SELECT account.id, account.cohort_day, period.days,
        account.cohort_day + period.days < (settings.as_of AT TIME ZONE 'UTC')::date AS eligible,
        EXISTS (SELECT 1 FROM analytics_user_activity_days activity
          WHERE activity.user_id = account.id
            AND activity.activity_date = account.cohort_day + period.days) AS returned
      FROM accounts account CROSS JOIN (VALUES (1), (7)) AS period(days) CROSS JOIN settings
    ), retention_summary AS (
      SELECT days,
        COUNT(*) FILTER (WHERE eligible)::int AS eligible,
        COUNT(*) FILTER (WHERE eligible AND returned)::int AS retained,
        ROUND(100.0 * COUNT(*) FILTER (WHERE eligible AND returned)
          / NULLIF(COUNT(*) FILTER (WHERE eligible), 0), 2) AS percent
      FROM retention_windows GROUP BY days
    ), cohort_summary AS (
      SELECT date_trunc('week', cohort_day)::date::text AS week,
        COUNT(*) FILTER (WHERE days = 1)::int AS accounts,
        COUNT(*) FILTER (WHERE days = 1 AND eligible)::int AS "eligibleD1",
        COUNT(*) FILTER (WHERE days = 1 AND eligible AND returned)::int AS "retainedD1",
        COUNT(*) FILTER (WHERE days = 7 AND eligible)::int AS "eligibleD7",
        COUNT(*) FILTER (WHERE days = 7 AND eligible AND returned)::int AS "retainedD7"
      FROM retention_windows GROUP BY date_trunc('week', cohort_day)::date
    ), sources AS (
      SELECT utm_source AS source, utm_medium AS medium, utm_campaign AS campaign,
        COUNT(*)::int AS installations
      FROM analytics_installations, settings
      WHERE first_opened_at >= settings.as_of - INTERVAL '90 days'
        AND first_opened_at <= settings.as_of
      GROUP BY utm_source, utm_medium, utm_campaign
    )
    SELECT jsonb_build_object(
      'since', (SELECT as_of - INTERVAL '90 days' FROM settings),
      'accounts', (SELECT COUNT(*) FROM accounts),
      'eligible7Days', (SELECT COUNT(*) FROM accounts WHERE eligible_7d),
      'excludedAccounts', (SELECT jsonb_array_length(excluded) FROM settings),
      'milestones', COALESCE((SELECT jsonb_agg(to_jsonb(milestone_summary) ORDER BY action) FROM milestone_summary), '[]'::jsonb),
      'retention', jsonb_build_object(
        'day1', COALESCE((SELECT to_jsonb(r) - 'days' FROM retention_summary r WHERE days = 1), jsonb_build_object('eligible',0,'retained',0,'percent',NULL)),
        'day7', COALESCE((SELECT to_jsonb(r) - 'days' FROM retention_summary r WHERE days = 7), jsonb_build_object('eligible',0,'retained',0,'percent',NULL))
      ),
      'cohorts', COALESCE((SELECT jsonb_agg(to_jsonb(cohort_summary) ORDER BY week DESC) FROM cohort_summary), '[]'::jsonb),
      'sources', COALESCE((SELECT jsonb_agg(to_jsonb(sources) ORDER BY installations DESC, source, campaign) FROM sources), '[]'::jsonb)
    ) AS report
  `;
}
