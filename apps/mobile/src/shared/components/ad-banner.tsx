import { useShowAds } from "../hooks/use-show-ads";

interface AdBannerProps {
  readonly size?: "banner" | "largeBanner" | "mediumRectangle";
  readonly style?: object;
}

export function AdBanner(_props: AdBannerProps) {
  useShowAds();
  return null;
}

export const AD_ITEM_MARKER = "__AD__" as const;

export function interleaveAds<T>(
  items: T[],
  interval: number = 8,
): (T | typeof AD_ITEM_MARKER)[] {
  if (items.length < 5) return items;

  const result: (T | typeof AD_ITEM_MARKER)[] = [];
  for (let i = 0; i < items.length; i++) {
    result.push(items[i]);
    if ((i + 1) % interval === 0 && i < items.length - 1) {
      result.push(AD_ITEM_MARKER);
    }
  }
  return result;
}
