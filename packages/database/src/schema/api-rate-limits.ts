import { integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const apiRateLimitBuckets = pgTable(
  "api_rate_limit_buckets",
  {
    keyHash: text("key_hash").notNull(),
    bucketStart: timestamp("bucket_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.keyHash, table.bucketStart] })],
);
