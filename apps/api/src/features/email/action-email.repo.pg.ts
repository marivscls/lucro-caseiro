import { randomBytes, randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type {
  ActionEmailCandidate,
  ActionEmailJob,
  ActionEmailPayload,
  ActionEmailRepo,
} from "./action-email.types";

function resultRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray(result.rows)
  )
    return result.rows as T[];
  return [];
}

export class ActionEmailRepoPg implements ActionEmailRepo {
  constructor(private db: AppDatabase) {}

  async getPreference(userId: string): Promise<boolean> {
    const rows = await this.db.execute(sql`
      SELECT enabled FROM app_email.action_preferences WHERE user_id=${userId}::uuid
    `);
    return resultRows<{ enabled: boolean }>(rows)[0]?.enabled === true;
  }

  async setPreference(userId: string, enabled: boolean): Promise<void> {
    const unsubscribeToken = randomBytes(32).toString("hex");
    await this.db.execute(sql`
      INSERT INTO app_email.action_preferences(user_id,enabled,consented_at,unsubscribe_token)
      VALUES (${userId}::uuid,${enabled},${enabled ? new Date() : null},${unsubscribeToken})
      ON CONFLICT (user_id) DO UPDATE SET
        enabled=excluded.enabled,
        consented_at=CASE
          WHEN excluded.enabled AND NOT app_email.action_preferences.enabled THEN now()
          ELSE app_email.action_preferences.consented_at
        END,
        updated_at=now()
    `);
  }

  async unsubscribe(token: string): Promise<boolean> {
    const rows = await this.db.execute(sql`
      UPDATE app_email.action_preferences SET enabled=false, updated_at=now()
      WHERE unsubscribe_token=${token} RETURNING user_id
    `);
    return resultRows(rows).length > 0;
  }

  async candidates(): Promise<ActionEmailCandidate[]> {
    const rows = await this.db.execute(sql`
      SELECT u.id AS "userId", a.email, u.name,
        p.unsubscribe_token AS "unsubscribeToken"
      FROM public.users u
      JOIN auth.users a ON a.id=u.id
      JOIN app_email.action_preferences p ON p.user_id=u.id
      WHERE p.enabled AND p.consented_at <= now()-interval '3 days'
        AND u.created_at <= now()-interval '3 days'
        AND u.is_active AND u.business_type IN ('food','crafts','other')
        AND a.email_confirmed_at IS NOT NULL
        AND a.email IS NOT NULL AND a.email <> ''
        AND a.deleted_at IS NULL
        AND (a.banned_until IS NULL OR a.banned_until <= now())
        AND NOT EXISTS (SELECT 1 FROM public.analytics_events e
          WHERE e.user_id=u.id AND e.occurred_at > now()-interval '3 days')
        AND NOT EXISTS (SELECT 1 FROM public.analytics_events e
          WHERE e.user_id=u.id AND e.event_type='action'
            AND e.event_name='pricing_completed')
        AND NOT EXISTS (SELECT 1 FROM public.products product WHERE product.user_id=u.id)
        AND NOT EXISTS (SELECT 1 FROM public.sales sale WHERE sale.user_id=u.id)
        AND NOT EXISTS (SELECT 1 FROM app_email.first_price_jobs job WHERE job.user_id=u.id)
        AND (NOT EXISTS (SELECT 1 FROM public.app_memberships m WHERE m.user_id=u.id)
          OR EXISTS (SELECT 1 FROM public.app_memberships m WHERE m.user_id=u.id
            AND m.brand_id='lucro-caseiro' AND m.status='active'))
      ORDER BY p.consented_at,u.id LIMIT 20
    `);
    return resultRows<ActionEmailCandidate>(rows);
  }

  async enqueue(userId: string, payload: ActionEmailPayload): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO app_email.first_price_jobs(user_id,payload)
      SELECT ${userId}::uuid,${JSON.stringify(payload)}::jsonb
      WHERE EXISTS (SELECT 1 FROM app_email.action_preferences p
        WHERE p.user_id=${userId}::uuid AND p.enabled)
      ON CONFLICT (user_id) DO NOTHING
    `);
  }

  async claim(): Promise<ActionEmailJob | null> {
    // Never retry after Resend's 24-hour idempotency window.
    await this.db.execute(sql`
      UPDATE app_email.first_price_jobs SET status='review',lease_token=NULL
      WHERE status IN ('pending','sending')
        AND (leased_until IS NULL OR leased_until<=now())
        AND (first_attempt_at<=now()-interval '23 hours' OR attempts>=8)
    `);
    const token = randomUUID();
    const rows = await this.db.execute(sql`
      WITH candidate AS (
        SELECT user_id FROM app_email.first_price_jobs
        WHERE status IN ('pending','sending') AND next_attempt_at<=now()
          AND (leased_until IS NULL OR leased_until<=now())
          AND (first_attempt_at IS NULL OR first_attempt_at>now()-interval '23 hours')
          AND attempts<8
          AND (SELECT count(*) FROM app_email.first_price_jobs
            WHERE first_attempt_at>=now()-interval '24 hours')<20
        ORDER BY next_attempt_at,user_id FOR UPDATE SKIP LOCKED LIMIT 1
      )
      UPDATE app_email.first_price_jobs job
      SET status='sending',lease_token=${token}::uuid,leased_until=now()+interval '5 minutes',
        first_attempt_at=coalesce(first_attempt_at,now()),attempts=attempts+1
      FROM candidate WHERE job.user_id=candidate.user_id
      RETURNING job.user_id AS "userId",job.lease_token AS token,job.payload
    `);
    return resultRows<ActionEmailJob>(rows)[0] ?? null;
  }

  async stillEligible(job: ActionEmailJob): Promise<boolean> {
    const rows = await this.db.execute(sql`
      SELECT 1 FROM public.users u
      JOIN auth.users a ON a.id=u.id
      JOIN app_email.action_preferences p ON p.user_id=u.id
      WHERE u.id=${job.userId}::uuid AND p.enabled
        AND p.consented_at<=now()-interval '3 days'
        AND u.is_active AND u.business_type IN ('food','crafts','other')
        AND a.email_confirmed_at IS NOT NULL
        AND a.email=${job.payload.message.to}
        AND a.deleted_at IS NULL
        AND (a.banned_until IS NULL OR a.banned_until<=now())
        AND NOT EXISTS (SELECT 1 FROM public.analytics_events e
          WHERE e.user_id=u.id AND e.occurred_at>now()-interval '3 days')
        AND NOT EXISTS (SELECT 1 FROM public.analytics_events e
          WHERE e.user_id=u.id AND e.event_type='action' AND e.event_name='pricing_completed')
        AND NOT EXISTS (SELECT 1 FROM public.products product WHERE product.user_id=u.id)
        AND NOT EXISTS (SELECT 1 FROM public.sales sale WHERE sale.user_id=u.id)
        AND (NOT EXISTS (SELECT 1 FROM public.app_memberships m WHERE m.user_id=u.id)
          OR EXISTS (SELECT 1 FROM public.app_memberships m WHERE m.user_id=u.id
            AND m.brand_id='lucro-caseiro' AND m.status='active'))
    `);
    return resultRows(rows).length > 0;
  }

  async cancelled(job: ActionEmailJob): Promise<void> {
    await this.db.execute(sql`
      UPDATE app_email.first_price_jobs SET status='cancelled',lease_token=NULL,leased_until=NULL
      WHERE user_id=${job.userId}::uuid AND lease_token=${job.token}::uuid AND status='sending'
    `);
  }

  async sent(job: ActionEmailJob, messageId: string): Promise<void> {
    await this.db.execute(sql`
      UPDATE app_email.first_price_jobs SET status='sent',provider_message_id=${messageId},
        sent_at=now(),lease_token=NULL,leased_until=NULL
      WHERE user_id=${job.userId}::uuid AND lease_token=${job.token}::uuid AND status='sending'
    `);
  }

  async failed(job: ActionEmailJob): Promise<void> {
    await this.db.execute(sql`
      UPDATE app_email.first_price_jobs
      SET status=CASE WHEN attempts>=8 THEN 'review' ELSE 'pending' END,
        lease_token=NULL,leased_until=NULL,
        next_attempt_at=now()+(power(2,least(attempts,7))*interval '1 minute')
      WHERE user_id=${job.userId}::uuid AND lease_token=${job.token}::uuid AND status='sending'
    `);
  }
}
