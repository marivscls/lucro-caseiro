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
}

export interface RetentionMetric {
  eligible: number;
  retained: number;
  percent: number | null;
}
