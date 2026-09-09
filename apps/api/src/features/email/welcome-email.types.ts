import type { EmailMessage } from "./resend-email";
import type { WelcomeProfile } from "./welcome-email";

export interface WelcomeCandidate extends WelcomeProfile {
  userId: string;
  email: string;
}
export interface WelcomePayload {
  from: string;
  message: EmailMessage;
}
export interface WelcomeJob {
  userId: string;
  token: string;
  payload: WelcomePayload;
}
export interface IWelcomeEmailRepo {
  activate(): Promise<void>;
  candidates(): Promise<WelcomeCandidate[]>;
  enqueue(userId: string, payload: WelcomePayload): Promise<void>;
  claim(): Promise<WelcomeJob | null>;
  sent(job: WelcomeJob, messageId: string): Promise<void>;
  failed(job: WelcomeJob): Promise<void>;
}
