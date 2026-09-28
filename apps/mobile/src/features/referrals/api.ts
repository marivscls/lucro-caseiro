import type { ReferralSummary } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/referrals";

export async function fetchReferralSummary(token: string): Promise<ReferralSummary> {
  return apiClient<ReferralSummary>(BASE, { token });
}

export async function claimReferral(
  token: string,
  code: string,
): Promise<ReferralSummary> {
  return apiClient<ReferralSummary>(`${BASE}/claim`, {
    method: "POST",
    body: { code },
    token,
  });
}
