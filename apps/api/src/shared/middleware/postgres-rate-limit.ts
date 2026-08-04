import { createHash } from "node:crypto";
import { sql, type SQL } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

import { ServiceUnavailableError } from "../errors";

interface RateLimitDatabase {
  execute(query: SQL): Promise<unknown>;
}

interface PostgresRateLimitOptions {
  db: RateLimitDatabase;
  scope: string;
  windowMs: number;
  max: number;
}

function clientKey(req: Request): string {
  const authorization = req.header("authorization");
  return authorization ? `auth:${authorization}` : `ip:${req.ip ?? "unknown"}`;
}

export function postgresRateLimit({
  db,
  scope,
  windowMs,
  max,
}: PostgresRateLimitOptions) {
  let nextCleanupAt = Date.now() + windowMs;
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const now = Date.now();
    const bucketStart = new Date(Math.floor(now / windowMs) * windowMs);
    const expiresAt = new Date(bucketStart.getTime() + windowMs * 2);
    const keyHash = createHash("sha256")
      .update(`${scope}:${clientKey(req)}`)
      .digest("hex");

    try {
      const rows = (await db.execute(sql`
        INSERT INTO api_rate_limit_buckets (key_hash, bucket_start, count, expires_at)
        VALUES (${keyHash}, ${bucketStart}, 1, ${expiresAt})
        ON CONFLICT (key_hash, bucket_start)
        DO UPDATE SET count = api_rate_limit_buckets.count + 1
        RETURNING count
      `)) as Array<{ count: number }>;
      const count = Number(rows[0]?.count ?? max + 1);

      if (now >= nextCleanupAt) {
        void db
          .execute(sql`DELETE FROM api_rate_limit_buckets WHERE expires_at < NOW()`)
          .catch((error: unknown) => console.error("Rate limit cleanup failed:", error));
        nextCleanupAt = now + windowMs;
      }
      if (count > max) {
        const retryAfter = Math.max(
          1,
          Math.ceil((bucketStart.getTime() + windowMs - now) / 1000),
        );
        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({
          error: "Muitas requisições em pouco tempo. Tente novamente em instantes.",
          code: "RATE_LIMITED",
        });
        return;
      }
      next();
    } catch (error) {
      console.error("Shared rate limiter failed:", error);
      next(
        new ServiceUnavailableError(
          "Proteção contra abuso indisponível. Tente novamente.",
        ),
      );
    }
  };
}
