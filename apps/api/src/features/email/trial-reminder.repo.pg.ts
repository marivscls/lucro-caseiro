import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type {
  ITrialReminderRepo,
  TrialReminderCandidate,
  TrialReminderJob,
  TrialReminderPayload,
} from "./trial-reminder.types";

function resultRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return (result as { rows: T[] }).rows;
}

export class TrialReminderRepoPg implements ITrialReminderRepo {
  constructor(private db: AppDatabase) {}

  async candidates(): Promise<TrialReminderCandidate[]> {
    const rows = await this.db.execute(sql`
      WITH due AS (
        SELECT u.id AS "userId", a.email, u.plan_expires_at AS "expiresAt",
          CASE
            WHEN u.plan_expires_at <= now() AND u.plan_expires_at > now() - interval '7 days'
              THEN 'ended'
            WHEN u.plan_expires_at > now() AND u.plan_expires_at <= now() + interval '1 day'
              THEN 'one_day'
            WHEN u.plan_expires_at > now() + interval '2 days'
              AND u.plan_expires_at <= now() + interval '3 days'
              THEN 'three_days'
          END AS stage
        FROM public.users u
        JOIN auth.users a ON a.id = u.id
        WHERE u.plan = 'essential' AND u.plan_is_trial = true
          AND u.plan_expires_at > now() - interval '7 days'
          AND u.plan_expires_at <= now() + interval '3 days'
          AND u.is_active = true AND a.email_confirmed_at IS NOT NULL
          AND a.deleted_at IS NULL
          AND (a.banned_until IS NULL OR a.banned_until <= now())
          AND a.email IS NOT NULL AND a.email <> ''
          AND (NOT EXISTS (SELECT 1 FROM public.app_memberships m WHERE m.user_id = u.id)
            OR EXISTS (SELECT 1 FROM public.app_memberships m
              WHERE m.user_id = u.id AND m.brand_id = 'lucro-caseiro' AND m.status = 'active'))
      )
      SELECT d."userId", d.email, d."expiresAt", d.stage
      FROM due d
      WHERE d.stage IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM app_email.trial_reminder_jobs j
          WHERE j.user_id = d."userId" AND j.stage = d.stage)
      ORDER BY d."expiresAt", d."userId" LIMIT 20
    `);
    return resultRows<TrialReminderCandidate>(rows);
  }

  async enqueue(
    candidate: TrialReminderCandidate,
    payload: TrialReminderPayload,
  ): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO app_email.trial_reminder_jobs(user_id,stage,trial_expires_at,payload)
      VALUES (${candidate.userId}::uuid,${candidate.stage},${candidate.expiresAt}::timestamptz,
        ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (user_id,stage) DO NOTHING
    `);
  }

  async claim(): Promise<TrialReminderJob | null> {
    // Resend only deduplicates for 24 hours. Stop ambiguous retries earlier.
    await this.db.execute(sql`
      UPDATE app_email.trial_reminder_jobs SET status='review', lease_token=NULL
      WHERE status IN ('pending','sending')
        AND (leased_until IS NULL OR leased_until <= now())
        AND (first_attempt_at <= now() - interval '23 hours' OR attempts >= 8)
    `);
    // A purchase, account change, changed address or passed reminder window
    // makes a queued message stale. Never send it just because it was queued.
    await this.db.execute(sql`
      UPDATE app_email.trial_reminder_jobs j SET status='cancelled', lease_token=NULL
      WHERE j.status IN ('pending','sending')
        AND (j.leased_until IS NULL OR j.leased_until <= now())
        AND NOT EXISTS (
          SELECT 1 FROM public.users u JOIN auth.users a ON a.id = u.id
          WHERE u.id = j.user_id AND u.is_active = true
            AND u.plan = 'essential' AND u.plan_is_trial = true
            AND u.plan_expires_at = j.trial_expires_at
            AND a.email_confirmed_at IS NOT NULL AND a.deleted_at IS NULL
            AND (a.banned_until IS NULL OR a.banned_until <= now())
            AND a.email = j.payload->'message'->>'to'
            AND (NOT EXISTS (SELECT 1 FROM public.app_memberships m WHERE m.user_id = u.id)
              OR EXISTS (SELECT 1 FROM public.app_memberships m
                WHERE m.user_id = u.id AND m.brand_id = 'lucro-caseiro' AND m.status = 'active'))
            AND (
              (j.stage = 'three_days' AND u.plan_expires_at > now() + interval '2 days'
                AND u.plan_expires_at <= now() + interval '3 days')
              OR (j.stage = 'one_day' AND u.plan_expires_at > now()
                AND u.plan_expires_at <= now() + interval '1 day')
              OR (j.stage = 'ended' AND u.plan_expires_at <= now()
                AND u.plan_expires_at > now() - interval '7 days')
            )
        )
    `);
    const token = randomUUID();
    const rows = await this.db.execute(sql`
      WITH candidate AS (
        SELECT user_id,stage FROM app_email.trial_reminder_jobs
        WHERE status IN ('pending','sending') AND next_attempt_at <= now()
          AND (leased_until IS NULL OR leased_until <= now())
          AND (first_attempt_at IS NULL OR first_attempt_at > now() - interval '23 hours')
          AND attempts < 8
        ORDER BY next_attempt_at,user_id,stage FOR UPDATE SKIP LOCKED LIMIT 1
      )
      UPDATE app_email.trial_reminder_jobs j
      SET status='sending', lease_token=${token}::uuid,
        leased_until=now()+interval '5 minutes',
        first_attempt_at=COALESCE(first_attempt_at,now()), attempts=attempts+1
      FROM candidate WHERE j.user_id=candidate.user_id AND j.stage=candidate.stage
      RETURNING j.user_id AS "userId", j.stage, j.lease_token AS token, j.payload
    `);
    return resultRows<TrialReminderJob>(rows)[0] ?? null;
  }

  async sent(job: TrialReminderJob, messageId: string): Promise<void> {
    await this.db.execute(sql`
      UPDATE app_email.trial_reminder_jobs
      SET status='sent', provider_message_id=${messageId}, sent_at=now(),
        lease_token=NULL, leased_until=NULL
      WHERE user_id=${job.userId}::uuid AND stage=${job.stage}
        AND lease_token=${job.token}::uuid AND status='sending'
    `);
  }

  async failed(job: TrialReminderJob): Promise<void> {
    await this.db.execute(sql`
      UPDATE app_email.trial_reminder_jobs
      SET status=CASE WHEN attempts>=8 THEN 'review' ELSE 'pending' END,
        lease_token=NULL, leased_until=NULL,
        next_attempt_at=now() + (power(2,least(attempts,7)) * interval '1 minute')
      WHERE user_id=${job.userId}::uuid AND stage=${job.stage}
        AND lease_token=${job.token}::uuid AND status='sending'
    `);
  }
}
