import type { EmailMessage } from "./resend-email";

export interface ActionEmailCandidate {
  userId: string;
  email: string;
  name: string;
  unsubscribeToken: string;
}

export interface ActionEmailPayload {
  from: string;
  message: EmailMessage;
}

export interface ActionEmailJob {
  userId: string;
  token: string;
  payload: ActionEmailPayload;
}

export interface ActionEmailRepo {
  candidates(): Promise<ActionEmailCandidate[]>;
  enqueue(userId: string, payload: ActionEmailPayload): Promise<void>;
  claim(): Promise<ActionEmailJob | null>;
  stillEligible(job: ActionEmailJob): Promise<boolean>;
  cancelled(job: ActionEmailJob): Promise<void>;
  sent(job: ActionEmailJob, messageId: string): Promise<void>;
  failed(job: ActionEmailJob): Promise<void>;
}
