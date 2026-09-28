import {
  ASSISTANT_MONTHLY_LIMITS,
  MEI_ANNUAL_REVENUE_LIMIT,
  MeiActivity,
  PixKeyType,
  REFERRAL_REQUIRED_SALES,
  REFERRAL_REWARD_DAYS,
  meiStatus,
  normalizePixKey,
} from "@lucro-caseiro/contracts";

import type { MockRequest, MockResult } from "./api";

// Rotas simuladas de Receber no Pix, Indique e ganhe, Cantinho do MEI e
// Anotar falando. A leitura por IA não roda na demonstração.

type Handler = (request: MockRequest, params: string[]) => MockResult;

const ok = (body: unknown, changed = false): MockResult => ({
  status: 200,
  body,
  changed,
});
const invalid = (message: string): MockResult => ({
  status: 400,
  body: { error: "VALIDATION_ERROR", message },
});
const unavailable = (message: string): MockResult => ({
  status: 400,
  body: { error: "DEMO_MODE", message },
});

const round = (value: number) => Math.round(value * 100) / 100;

const getPix: Handler = ({ data }) =>
  ok(data.pixSettings ?? { pixKeyType: null, pixKey: null, pixCity: null });

const putPix: Handler = ({ data, body }) => {
  const city = typeof body.pixCity === "string" ? body.pixCity.trim() || null : null;
  const type = PixKeyType.safeParse(body.pixKeyType);
  const raw = typeof body.pixKey === "string" ? body.pixKey : "";
  if (!type.success || !raw.trim()) {
    data.pixSettings = { pixKeyType: null, pixKey: null, pixCity: city };
    return ok(data.pixSettings, true);
  }
  const key = normalizePixKey(type.data, raw);
  if (!key) return invalid("Essa chave Pix não parece válida.");
  data.pixSettings = { pixKeyType: type.data, pixKey: key, pixCity: city };
  return ok(data.pixSettings, true);
};

const createLink: Handler = ({ body }) => {
  const clientId = typeof body.clientId === "string" ? body.clientId : "";
  return ok({ token: `demo${clientId.replace(/-/g, "").slice(0, 12)}`, clientId });
};

function referralCode(name: string): string {
  const letters = name
    .normalize("NFD")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 4);
  return `${letters}DEMO`.slice(0, 8).padEnd(6, "X");
}

const getReferrals: Handler = ({ data }) =>
  ok({
    code: referralCode(data.profile.businessName ?? data.profile.name ?? ""),
    invitedCount: 0,
    rewardedCount: 0,
    referredByName: null,
    rewarded: false,
    canClaim: true,
    salesCount: data.sales.length,
    rewardDays: REFERRAL_REWARD_DAYS,
    requiredSales: REFERRAL_REQUIRED_SALES,
  });

const meiSummary: Handler = ({ data, query, now }) => {
  const today = new Date(now);
  const year = Number(query.get("year")) || today.getFullYear();
  const month = Number(query.get("month")) || today.getMonth() + 1;
  const lastMonth = year === today.getFullYear() ? today.getMonth() + 1 : 12;
  const monthly = Array.from({ length: lastMonth }, (_, index) => {
    const prefix = `${year}-${String(index + 1).padStart(2, "0")}`;
    return round(
      data.financeEntries
        .filter((entry) => entry.type === "income" && entry.date.startsWith(prefix))
        .reduce((sum, entry) => sum + entry.amount, 0),
    );
  });
  const yearRevenue = round(monthly.reduce((sum, value) => sum + value, 0));
  const limit = MEI_ANNUAL_REVENUE_LIMIT;
  return ok({
    year,
    month,
    activity: data.meiActivity ?? null,
    monthRevenue: monthly[month - 1] ?? 0,
    yearRevenue,
    annualLimit: limit,
    usedRatio: Math.round((yearRevenue / limit) * 1000) / 1000,
    remaining: round(Math.max(0, limit - yearRevenue)),
    projectedYearRevenue: round((yearRevenue / Math.max(1, monthly.length)) * 12),
    status: meiStatus(yearRevenue, limit),
    months: monthly.map((revenue, index) => ({ month: index + 1, revenue })),
  });
};

const putMei: Handler = ({ data, body }) => {
  const activity = MeiActivity.nullable().safeParse(body.activity ?? null);
  if (!activity.success) return invalid("Escolha uma atividade.");
  data.meiActivity = activity.data;
  return ok({ activity: activity.data }, true);
};

const AI_DEMO =
  "Na demonstração o app não lê áudio nem foto. Crie sua conta para anotar falando.";

export const growthRoutes: [string, RegExp, Handler][] = [
  ["GET", /^\/api\/v1\/fiado\/pix$/, getPix],
  ["PUT", /^\/api\/v1\/fiado\/pix$/, putPix],
  ["POST", /^\/api\/v1\/fiado\/links$/, createLink],
  ["GET", /^\/api\/v1\/referrals$/, getReferrals],
  [
    "POST",
    /^\/api\/v1\/referrals\/claim$/,
    () => unavailable("Convites não valem na demonstração. Crie sua conta para usar."),
  ],
  ["GET", /^\/api\/v1\/mei\/summary$/, meiSummary],
  ["PUT", /^\/api\/v1\/mei\/settings$/, putMei],
  [
    "GET",
    /^\/api\/v1\/assistant\/usage$/,
    () => ok({ used: 0, limit: ASSISTANT_MONTHLY_LIMITS.free }),
  ],
  ["POST", /^\/api\/v1\/assistant\/sale-draft$/, () => unavailable(AI_DEMO)],
  ["POST", /^\/api\/v1\/assistant\/notebook$/, () => unavailable(AI_DEMO)],
  ["POST", /^\/api\/v1\/assistant\/notebook\/import$/, () => unavailable(AI_DEMO)],
];
