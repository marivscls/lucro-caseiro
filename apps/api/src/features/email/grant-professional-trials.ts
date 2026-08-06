import { createHash } from "node:crypto";

import postgres from "postgres";

import { config } from "../../config";
import { buildProfessionalTrialEmail } from "./professional-trial-email";
import { createResendEmailSender } from "./resend-email";

const RECIPIENTS = [
  "lethfreiregomes@gmail.com",
  "cana5499@gmail.com",
  "anndreiamoreira55@gmail.com",
  "patriciamarcelinoox@gmail.com",
  "apsilvacruz@gmail.com",
  "comercial.triades@gmail.com",
  "jose.santiagojs198@gmail.com",
  "manoelsantos5672@gmail.com",
] as const;

const CONFIRMATION_FLAG = "--confirm-8-users";
const VERIFICATION_FLAG = "--verify-8-users";
const shouldConfirm = process.argv.includes(CONFIRMATION_FLAG);
const shouldVerify = process.argv.includes(VERIFICATION_FLAG);
const sql = postgres(config.databaseUrl, { max: 1, prepare: false });

type AccountRow = {
  email: string;
  name: string;
  plan: string;
  plan_expires_at: Date | null;
  is_active: boolean;
  created_at: Date;
};

async function loadAccount(email: string): Promise<AccountRow> {
  const rows = await sql<AccountRow[]>`
    SELECT email, name, plan, plan_expires_at, is_active, created_at
    FROM public.users
    WHERE lower(email) = lower(${email})
  `;

  if (rows.length !== 1) {
    throw new Error(`Conta nao encontrada ou duplicada: ${email}`);
  }

  return rows[0]!;
}

function assertEligible(account: AccountRow): void {
  if (!account.is_active || account.plan !== "free" || account.plan_expires_at) {
    throw new Error(
      `Conta nao elegivel: ${account.email} (active=${account.is_active}, plan=${account.plan}, expires=${account.plan_expires_at?.toISOString() ?? "null"})`,
    );
  }
}

const content = buildProfessionalTrialEmail();
const renderedContent = `${content.text}\n${content.html}`;
if (
  !content.text.startsWith("Oi!\n") ||
  !content.html.includes(">Oi!</p>") ||
  renderedContent.toLocaleLowerCase("pt-BR").includes("mariana")
) {
  throw new Error("O template da campanha nao usa a saudacao neutra aprovada");
}

try {
  const accounts = await Promise.all(RECIPIENTS.map(loadAccount));
  if (shouldVerify) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: "verification",
          count: accounts.length,
          accounts: accounts.map(({ email, plan, plan_expires_at, is_active }) => ({
            email,
            plan,
            planExpiresAt: plan_expires_at,
            isActive: is_active,
          })),
        },
        null,
        2,
      )}\n`,
    );
  } else {
    accounts.forEach(assertEligible);

    if (!shouldConfirm) {
      process.stdout.write(
        `${JSON.stringify(
          {
            mode: "dry-run",
            count: accounts.length,
            greeting: "Oi!",
            recipients: accounts.map(({ email, name, plan, plan_expires_at }) => ({
              email,
              name,
              plan,
              planExpiresAt: plan_expires_at,
            })),
            nextCommandFlag: CONFIRMATION_FLAG,
          },
          null,
          2,
        )}\n`,
      );
    } else {
      const updatedAccounts = await sql.begin(async (transaction) => {
        const [clock] = await transaction.unsafe<
          Array<{ granted_at: Date; expires_at: Date }>
        >("SELECT NOW() AS granted_at, NOW() + INTERVAL '1 month' AS expires_at");
        if (!clock) throw new Error("Nao foi possivel calcular a validade da campanha");

        const updated: Array<{ email: string; plan: string; plan_expires_at: Date }> = [];
        for (const email of RECIPIENTS) {
          const rows = await transaction.unsafe<
            Array<{ email: string; plan: string; plan_expires_at: Date }>
          >(
            `
          UPDATE public.users
          SET plan = 'professional', plan_expires_at = $1
          WHERE lower(email) = lower($2)
            AND is_active = true
            AND plan = 'free'
            AND plan_expires_at IS NULL
          RETURNING email, plan, plan_expires_at
          `,
            [clock.expires_at, email],
          );
          const [updatedAccount] = rows;
          if (rows.length !== 1 || !updatedAccount) {
            throw new Error(
              `A ativacao foi interrompida antes de alterar a coorte: ${email}`,
            );
          }
          updated.push(updatedAccount);
        }

        return { grantedAt: clock.granted_at, expiresAt: clock.expires_at, updated };
      });

      const sendEmail = createResendEmailSender(config.resendApiKey, config.emailFrom);
      const deliveries: Array<{ email: string; id?: string; error?: string }> = [];

      for (const email of RECIPIENTS) {
        try {
          const recipientHash = createHash("sha256")
            .update(email)
            .digest("hex")
            .slice(0, 16);
          const result = await sendEmail({
            to: email,
            ...content,
            idempotencyKey: `professional-trial-gift-2026-08-06-${recipientHash}`,
            ...(config.emailReplyTo ? { replyTo: config.emailReplyTo } : {}),
          });
          deliveries.push({ email, id: result.id });
        } catch (error) {
          deliveries.push({
            email,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      process.stdout.write(
        `${JSON.stringify(
          {
            mode: "confirmed",
            greeting: "Oi!",
            grantedAt: updatedAccounts.grantedAt,
            expiresAt: updatedAccounts.expiresAt,
            updated: updatedAccounts.updated,
            deliveries,
          },
          null,
          2,
        )}\n`,
      );

      if (deliveries.some((delivery) => delivery.error)) process.exitCode = 1;
    }
  }
} finally {
  await sql.end();
}
