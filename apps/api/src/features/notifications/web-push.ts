import webpush from "web-push";
import type { WebPushRepoPg, WebPushSender } from "./web-push.repo.pg";

export function createWebPushSender(
  publicKey: string,
  privateKey: string,
  subject: string,
): WebPushSender {
  return async (subscription, message) => {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(message), {
        vapidDetails: { publicKey, privateKey, subject },
        TTL: 3600,
        timeout: 10_000,
      });
      return "sent";
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) return "expired";
      // Provider errors can contain endpoint URLs and encryption keys. Do not log them.
      throw new Error("Falha ao enviar notificação ao navegador");
    }
  };
}

export function startWebPushWorker(repo: WebPushRepoPg, send: WebPushSender): () => void {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await repo.runOnce(send);
    } catch {
      console.error("[web-push] worker failed; next poll will retry");
    } finally {
      busy = false;
    }
  };
  void tick();
  const timer = setInterval(() => void tick(), 60_000);
  timer.unref();
  return () => clearInterval(timer);
}
