import { createHash } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { apiRateLimitBuckets, createClient } from "@lucro-caseiro/database";

import { ServiceUnavailableError } from "../errors";

interface RateLimitStore {
  increment(input: {
    keyHash: string;
    bucketStart: Date;
    expiresAt: Date;
  }): Promise<number>;
  cleanup(expiredBefore: Date): Promise<void>;
}

interface PostgresRateLimitOptions {
  store: RateLimitStore;
  scope: string;
  windowMs: number;
  max: number;
}

function clientKey(req: Request): string {
  const authorization = req.header("authorization");
  return authorization ? `auth:${authorization}` : `ip:${req.ip ?? "unknown"}`;
}

export function createPostgresRateLimitStore(
  db: ReturnType<typeof createClient>,
): RateLimitStore {
  return {
    async increment({ keyHash, bucketStart, expiresAt }) {
      const [bucket] = await db
        .insert(apiRateLimitBuckets)
        .values({ keyHash, bucketStart, expiresAt })
        .onConflictDoUpdate({
          target: [apiRateLimitBuckets.keyHash, apiRateLimitBuckets.bucketStart],
          set: {
            count: sql`${apiRateLimitBuckets.count} + 1`,
            expiresAt,
          },
        })
        .returning({ count: apiRateLimitBuckets.count });

      if (!bucket) throw new Error("Rate limit bucket was not returned");
      return bucket.count;
    },
    async cleanup(expiredBefore) {
      await db
        .delete(apiRateLimitBuckets)
        .where(lt(apiRateLimitBuckets.expiresAt, expiredBefore));
    },
  };
}

export function postgresRateLimit({
  store,
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
      const count = await store.increment({ keyHash, bucketStart, expiresAt });

      if (now >= nextCleanupAt) {
        void store
          .cleanup(new Date(now))
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
