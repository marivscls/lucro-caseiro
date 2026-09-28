import type { EmailMessage } from "./resend-email";
import type { TrialReminderStage } from "./trial-reminder";

export interface TrialReminderCandidate {
  userId: string;
  email: string;
  stage: TrialReminderStage;
  expiresAt: string;
}

export interface TrialReminderPayload {
  from: string;
  message: EmailMessage;
}

export interface TrialReminderJob {
  userId: string;
  stage: TrialReminderStage;
  token: string;
  payload: TrialReminderPayload;
}

export interface ITrialReminderRepo {
  candidates(): Promise<TrialReminderCandidate[]>;
  enqueue(
    candidate: TrialReminderCandidate,
    payload: TrialReminderPayload,
  ): Promise<void>;
  claim(): Promise<TrialReminderJob | null>;
  sent(job: TrialReminderJob, messageId: string): Promise<void>;
  failed(job: TrialReminderJob): Promise<void>;
}
