import type { InstallAttribution } from "@lucro-caseiro/contracts";

// Keep campaign labels only: referrers can contain arbitrary private parameters.
export function parseInstallReferrer(referrer: string): InstallAttribution | undefined {
  const params = new URLSearchParams(
    referrer.includes("?") ? referrer.split("?")[1] : referrer,
  );
  const label = (key: string) => {
    const value = params.get(key);
    return value && value.length <= 100 && /^[a-zA-Z0-9_.-]+$/.test(value)
      ? value
      : undefined;
  };
  const source = label("utm_source");
  if (!source) return undefined;
  return {
    source,
    ...(label("utm_medium") ? { medium: label("utm_medium") } : {}),
    ...(label("utm_campaign") ? { campaign: label("utm_campaign") } : {}),
    ...(label("utm_content") ? { content: label("utm_content") } : {}),
  };
}

async function readWithDeadline(readNativeReferrer: () => Promise<string>) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const raw = await Promise.race([
      readNativeReferrer(),
      new Promise<string>((resolve) => {
        timeout = setTimeout(() => resolve(""), 1500);
      }),
    ]);
    return parseInstallReferrer(raw);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

export function createAttributionReader(readNativeReferrer: () => Promise<string>) {
  let cached: InstallAttribution | undefined;
  let pending: Promise<InstallAttribution | undefined> | undefined;
  return () => {
    if (cached) return Promise.resolve(cached);
    pending ??= readWithDeadline(readNativeReferrer)
      .then((value) => {
        cached = value;
        return value;
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };
}
