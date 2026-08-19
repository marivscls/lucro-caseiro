export type GettingStartedStage = "product" | "sale" | "result";

export function getGettingStartedStage(
  hasProduct: boolean,
  hasSale: boolean,
): GettingStartedStage {
  if (!hasProduct) return "product";
  if (!hasSale) return "sale";
  return "result";
}

export function shouldShowGettingStarted({
  settled,
  completed,
  started,
  hasProduct,
  hasSale,
}: Readonly<{
  settled: boolean;
  completed: boolean;
  started: boolean;
  hasProduct: boolean;
  hasSale: boolean;
}>): boolean {
  if (!settled || completed) return false;

  // Nao apresenta um guia novo a quem ja chegou ao resultado por conta propria.
  return started || !hasProduct || !hasSale;
}
