import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type {
  IWelcomeEmailRepo,
  WelcomeCandidate,
  WelcomeJob,
  WelcomePayload,
} from "./welcome-email.types";

export class WelcomeEmailRepoPg implements IWelcomeEmailRepo {
  constructor(private db: AppDatabase) {}

  async activate(): Promise<void> {
    await this.db.execute(
      sql`INSERT INTO app_email.welcome_settings(singleton) VALUES (true) ON CONFLICT DO NOTHING`,
    );
  }

  async candidates(): Promise<WelcomeCandidate[]> {
    // Internal, operator-authorized signup sweep. All delivery writes are scoped
    // to one user. Auth confirmation is checked independently of editable metadata.
    const rows = await this.db.execute(sql`
      SELECT u.id AS "userId", a.email, u.name, u.business_name AS "businessName", u.business_type AS "businessType"
      FROM public.users u
      JOIN auth.users a ON a.id = u.id
      CROSS JOIN app_email.welcome_settings settings
      WHERE u.created_at >= settings.activated_at
        AND a.created_at >= settings.activated_at
        AND u.created_at <= now() - interval '5 minutes'
        AND u.is_active = true AND a.email_confirmed_at IS NOT NULL
        AND a.deleted_at IS NULL AND (a.banned_until IS NULL OR a.banned_until <= now())
        AND a.email IS NOT NULL AND a.email <> ''
        AND NOT EXISTS (SELECT 1 FROM app_email.welcome_jobs j WHERE j.user_id = u.id)
        AND (NOT EXISTS (SELECT 1 FROM public.app_memberships m WHERE m.user_id = u.id)
          OR EXISTS (SELECT 1 FROM public.app_memberships m WHERE m.user_id = u.id AND m.brand_id = 'lucro-caseiro' AND m.status = 'active'))
      ORDER BY u.created_at, u.id LIMIT 20
    `);
    return rows as unknown as WelcomeCandidate[];
  }

  async enqueue(userId: string, payload: WelcomePayload): Promise<void> {
    await this.db.execute(
      sql`INSERT INTO app_email.welcome_jobs(user_id,payload) VALUES (${userId},${JSON.stringify(payload)}::jsonb) ON CONFLICT (user_id) DO NOTHING`,
    );
  }

  async claim(): Promise<WelcomeJob | null> {
    // Stop ambiguous retries before the provider's 24h idempotency expiry.
    // Never silently resend an old job after an extended outage.
    await this.db.execute(sql`
      UPDATE app_email.welcome_jobs SET status = 'review', lease_token = NULL
      WHERE status IN ('pending','sending')
        AND (leased_until IS NULL OR leased_until <= now())
        AND (first_attempt_at <= now() - interval '23 hours' OR attempts >= 8)
    `);
    await this.db.execute(sql`
      UPDATE app_email.welcome_jobs j SET status = 'cancelled', lease_token = NULL
      WHERE j.status IN ('pending','sending') AND (j.leased_until IS NULL OR j.leased_until <= now())
        AND NOT EXISTS (SELECT 1 FROM public.users u JOIN auth.users a ON a.id=u.id
          WHERE u.id=j.user_id AND u.is_active=true AND a.email_confirmed_at IS NOT NULL
          AND a.email=j.payload->'message'->>'to' AND a.deleted_at IS NULL
          AND (a.banned_until IS NULL OR a.banned_until<=now()))
    `);
    const token = randomUUID();
    const rows = await this.db.execute(sql`
      WITH candidate AS (
        SELECT user_id FROM app_email.welcome_jobs
        WHERE status IN ('pending','sending') AND next_attempt_at <= now()
          AND (leased_until IS NULL OR leased_until <= now())
          AND (first_attempt_at IS NULL OR first_attempt_at > now() - interval '23 hours')
          AND attempts < 8
        ORDER BY next_attempt_at, user_id FOR UPDATE SKIP LOCKED LIMIT 1
      )
      UPDATE app_email.welcome_jobs j
      SET status='sending', lease_token=${token}::uuid, leased_until=now()+interval '5 minutes',
        first_attempt_at=COALESCE(first_attempt_at,now()), attempts=attempts+1
      FROM candidate WHERE j.user_id=candidate.user_id
      RETURNING j.user_id AS "userId", j.lease_token AS token, j.payload
    `);
    return (rows[0] as unknown as WelcomeJob | undefined) ?? null;
  }

  async sent(job: WelcomeJob, messageId: string): Promise<void> {
    await this.db.execute(sql`
      UPDATE app_email.welcome_jobs SET status='sent', provider_message_id=${messageId},
        sent_at=now(), lease_token=NULL, leased_until=NULL
      WHERE user_id=${job.userId} AND lease_token=${job.token}::uuid AND status='sending'
    `);
  }

  async failed(job: WelcomeJob): Promise<void> {
    await this.db.execute(sql`
      UPDATE app_email.welcome_jobs SET status=CASE WHEN attempts>=8 THEN 'review' ELSE 'pending' END,
        lease_token=NULL, leased_until=NULL,
        next_attempt_at=now() + (power(2,least(attempts,7)) * interval '1 minute')
      WHERE user_id=${job.userId} AND lease_token=${job.token}::uuid AND status='sending'
    `);
  }
}
