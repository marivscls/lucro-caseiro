export const MOBILE_TAB_BAR_HIDDEN_ROOT_SEGMENTS = [
  "",
  "(auth)",
  "auth",
  "onboarding",
  "reset-password",
  "c",
] as const;

export type MobileTabKey = "index" | "sales" | "new-sale" | "agenda" | "clients" | "more";

export function shouldShowMobileTabBar(args: {
  isDesktop: boolean;
  isAuthenticated: boolean;
  rootSegment: string;
}): boolean {
  if (args.isDesktop || !args.isAuthenticated) return false;
  return !(MOBILE_TAB_BAR_HIDDEN_ROOT_SEGMENTS as readonly string[]).includes(
    args.rootSegment,
  );
}

export function resolveActiveMobileTab(
  pathname: string,
  hasScheduling: boolean,
): MobileTabKey {
  let path = pathname;
  while (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  if (!path) path = "/";
  if (path === "/tabs" || path === "/tabs/index") return "index";
  if (path === "/tabs/sales" || path.startsWith("/tabs/sales/")) return "sales";
  if (path === "/tabs/new-sale" || path.startsWith("/tabs/new-sale/")) return "new-sale";
  if (hasScheduling && (path === "/tabs/agenda" || path.startsWith("/tabs/agenda/"))) {
    return "agenda";
  }
  if (!hasScheduling && (path === "/tabs/clients" || path.startsWith("/tabs/clients/"))) {
    return "clients";
  }
  return "more";
}
