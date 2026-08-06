import { createHash } from "node:crypto";

import { config } from "../../config";
import { buildProfessionalTrialEmail } from "./professional-trial-email";
import { createResendEmailSender } from "./resend-email";
import { parseTestEmailArgs } from "./send-test-email.args";

const { recipient } = parseTestEmailArgs(process.argv.slice(2));
const content = buildProfessionalTrialEmail();

const date = new Date().toISOString().slice(0, 10);
const recipientHash = createHash("sha256").update(recipient).digest("hex").slice(0, 16);
const sendEmail = createResendEmailSender(config.resendApiKey, config.emailFrom);

const result = await sendEmail({
  to: recipient,
  ...content,
  idempotencyKey: `professional-trial-preview-v8-${date}-${recipientHash}`,
  ...(config.emailReplyTo ? { replyTo: config.emailReplyTo } : {}),
});

process.stdout.write(`${JSON.stringify({ recipient, id: result.id })}\n`);
