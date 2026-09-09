import type { WelcomeEmailUseCases } from "./welcome-email.usecases";

export function startWelcomeEmailWorker(useCases: WelcomeEmailUseCases): () => void {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const result = await useCases.runOnce();
      if (result !== "idle") console.warn(`[welcome-email] ${result}`);
    } catch {
      // Do not log recipient addresses, frozen content, or provider credentials.
      console.error("[welcome-email] processing failed; next poll will retry");
    } finally {
      busy = false;
    }
  };
  void tick();
  const timer = setInterval(() => void tick(), 60_000);
  timer.unref();
  return () => clearInterval(timer);
}
