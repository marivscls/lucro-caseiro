import { GUIDANCE_AREAS, type GuidanceArea } from "@lucro-caseiro/contracts";
export { GUIDANCE_AREAS, type GuidanceArea };
export type GuidanceProgress = {
  presented?: boolean;
  dismissed?: boolean;
  completed?: boolean;
};
export type GuidanceDecision = "presented" | "dismissed" | "completed";
export function advanceGuidance(
  progress: GuidanceProgress,
  decision: GuidanceDecision,
): GuidanceProgress {
  return { ...progress, [decision]: true };
}
export function shouldIntroduce(
  progress: GuidanceProgress,
  hasRecords: boolean,
): boolean {
  return !hasRecords && !progress.dismissed && !progress.completed;
}
export function parseGuidance(
  raw: string | null,
): Partial<Record<GuidanceArea, GuidanceProgress>> {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const result: Partial<Record<GuidanceArea, GuidanceProgress>> = {};
    for (const area of GUIDANCE_AREAS) {
      const entry = (value as Record<string, unknown>)[area];
      if (!entry || typeof entry !== "object") continue;
      const data = entry as Record<string, unknown>;
      result[area] = {
        presented: data.presented === true,
        dismissed: data.dismissed === true,
        completed: data.completed === true,
      };
    }
    return result;
  } catch {
    return {};
  }
}
