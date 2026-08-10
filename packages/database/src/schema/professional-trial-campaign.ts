import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const professionalTrialCampaignGrants = pgTable(
  "professional_trial_campaign_grants",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignKey: text("campaign_key").notNull(),
    email: text("email").notNull(),
    source: text("source").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    emailClaimedAt: timestamp("email_claimed_at", { withTimezone: true }),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    emailMessageId: text("email_message_id"),
    emailAttempts: integer("email_attempts").notNull().default(0),
    emailLastError: text("email_last_error"),
  },
);
