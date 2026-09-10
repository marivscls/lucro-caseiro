export type LandingEvent = "calculator_first_edit" | "calculator_valid_result";

/** Only interaction state crosses this boundary; never calculator values. */
export function createCalculatorTracking(send: (event: LandingEvent) => void) {
  let started = false;
  let completed = false;
  let userInput = false;
  return {
    edit() {
      userInput = true;
      if (!started) {
        started = true;
        send("calculator_first_edit");
      }
    },
    result(valid: boolean) {
      if (userInput && valid && !completed) {
        completed = true;
        send("calculator_valid_result");
      }
    },
    example() {
      userInput = false;
    },
  };
}
export function describeCta(label: string) {
  if (label.startsWith("pwa_")) return { event: "start_web", placement: label.slice(4) };
  if (label.startsWith("play_store_"))
    return { event: "start_android", placement: label.slice(11) };
  return { event: label, placement: label };
}
