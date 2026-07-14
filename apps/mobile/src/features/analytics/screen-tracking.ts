import type { AnalyticsScreenName } from "@lucro-caseiro/contracts";

const STATIC_SCREENS: Record<string, AnalyticsScreenName> = {
  "/": "login",
  "/login": "login",
  "/register": "register",
  "/auth/callback": "auth_callback",
  // Chave de evento fixa, não uma credencial.
  // eslint-disable-next-line sonarjs/no-hardcoded-passwords
  "/reset-password": "reset_password",
  "/onboarding": "onboarding",
  "/tabs": "home",
  "/tabs/index": "home",
  "/tabs/sales": "sales",
  "/tabs/new-sale": "new_sale",
  "/tabs/agenda": "agenda",
  "/tabs/clients": "clients",
  "/tabs/more": "more",
  "/admin-metrics": "admin_metrics",
};

const ROOT_SCREENS: Record<string, AnalyticsScreenName> = {
  agenda: "agenda",
  catalog: "catalog",
  fiado: "fiado",
  finance: "finance",
  insights: "insights",
  labels: "labels",
  materials: "materials",
  packaging: "packaging",
  plans: "plans",
  pricing: "pricing",
  products: "products",
  purchases: "purchases",
  quotes: "quotes",
  recipes: "recipes",
  "recurring-expenses": "recurring_expenses",
  settings: "settings",
  suppliers: "suppliers",
  support: "support",
};

export function analyticsScreenForPath(pathname: string): AnalyticsScreenName | null {
  const staticScreen = STATIC_SCREENS[pathname];
  if (staticScreen) return staticScreen;

  const rootSegment = pathname.split("/").filter(Boolean)[0];
  return rootSegment ? (ROOT_SCREENS[rootSegment] ?? null) : null;
}

export function activeDurationMs(
  startedAt: number | null,
  endedAt: number,
): number | null {
  if (startedAt === null) return null;
  const duration = Math.min(Math.max(endedAt - startedAt, 0), 6 * 60 * 60 * 1000);
  return duration >= 250 ? duration : null;
}
