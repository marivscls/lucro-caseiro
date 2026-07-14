export const ANALYTICS_SCREEN_NAMES = [
  "login",
  "register",
  "auth_callback",
  "reset_password",
  "onboarding",
  "home",
  "sales",
  "new_sale",
  "agenda",
  "clients",
  "more",
  "admin_metrics",
  "catalog",
  "fiado",
  "finance",
  "insights",
  "labels",
  "materials",
  "packaging",
  "plans",
  "pricing",
  "products",
  "purchases",
  "quotes",
  "recipes",
  "recurring_expenses",
  "settings",
  "suppliers",
  "support",
] as const;

export const ANALYTICS_ACTION_NAMES = [
  "signup_completed",
  "pricing_completed",
  "product_created",
  "sale_completed",
  "order_created",
  "catalog_shared",
  "quote_created",
  "quote_pdf_exported",
  "finance_entry_created",
  "subscription_started",
] as const;

export type AnalyticsScreenName = (typeof ANALYTICS_SCREEN_NAMES)[number];
export type AnalyticsActionName = (typeof ANALYTICS_ACTION_NAMES)[number];

export type ProductAnalyticsEvent =
  | { type: "screen_view"; name: AnalyticsScreenName; durationMs: number }
  | { type: "action"; name: AnalyticsActionName };

export interface ProductAnalyticsDashboard {
  generatedAt: string;
  installations: {
    total: number;
    last7Days: number;
    last30Days: number;
    linkedToUser: number;
  };
  signups: {
    total: number;
    last30Days: number;
  };
  activation: {
    activatedUsers: number;
    eligibleWithin7Days: number;
    activatedWithin7Days: number;
    rateWithin7DaysPercent: number | null;
  };
  active: {
    installations: { day1: number; day7: number; day30: number };
    users: { day1: number; day7: number; day30: number };
  };
  retention: {
    day1: RetentionMetric;
    day7: RetentionMetric;
    day30: RetentionMetric;
  };
  screenUsage: ScreenUsageMetric[];
  featureUsage: FeatureUsageMetric[];
  funnel: FunnelMetric[];
  versionAdoption: VersionAdoptionMetric[];
  behaviorRetention: BehaviorRetentionMetric[];
}

export interface RetentionMetric {
  eligible: number;
  retained: number;
  percent: number | null;
}

export interface ScreenUsageMetric {
  screen: AnalyticsScreenName;
  visits: number;
  people: number;
  activeMinutes: number;
  averageActiveSeconds: number;
}

export interface FeatureUsageMetric {
  action: AnalyticsActionName;
  events: number;
  people: number;
}

export interface FunnelMetric {
  stage: "installation" | "signup" | "pricing" | "product" | "sale";
  installations: number;
  previousStagePercent: number | null;
}

export interface VersionAdoptionMetric {
  appVersion: string;
  installations: number;
  percent: number | null;
}

export interface BehaviorRetentionMetric extends RetentionMetric {
  behavior: "pricing_completed" | "catalog_shared";
}
