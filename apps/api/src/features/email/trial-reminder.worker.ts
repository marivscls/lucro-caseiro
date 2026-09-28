import type { TrialReminderUseCases } from "./trial-reminder.usecases";

export function startTrialReminderWorker(useCases: TrialReminderUseCases): () => void {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const result = await useCases.runOnce();
      if (result !== "idle") console.warn(`[trial-reminder] ${result}`);
    } catch {
      // The queue contains addresses and message content; never log either.
      console.error("[trial-reminder] processing failed; next poll will retry");
    } finally {
      busy = false;
    }
  };
  void tick();
  const timer = setInterval(() => void tick(), 60_000);
  timer.unref();
  return () => clearInterval(timer);
}
