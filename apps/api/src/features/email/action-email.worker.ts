import type { ActionEmailUseCases } from "./action-email.usecases";

export function startActionEmailWorker(useCases: ActionEmailUseCases): () => void {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const result = await useCases.runOnce();
      if (result !== "idle") console.warn(`[action-email] ${result}`);
    } catch {
      console.error("[action-email] processing failed; next poll will retry");
    } finally {
      busy = false;
    }
  };
  void tick();
  const timer = setInterval(() => void tick(), 60_000);
  timer.unref();
  return () => clearInterval(timer);
}
