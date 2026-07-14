import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { fetchAdminAnalyticsAccess, fetchAdminAnalyticsDashboard } from "./api";

const ADMIN_ANALYTICS_KEY = ["analytics", "admin"];

export function useAdminAnalyticsAccess() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...ADMIN_ANALYTICS_KEY, "access"],
    queryFn: () => fetchAdminAnalyticsAccess(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useAdminAnalyticsDashboard() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...ADMIN_ANALYTICS_KEY, "dashboard"],
    queryFn: () => fetchAdminAnalyticsDashboard(token!),
    enabled: !!token,
    retry: false,
  });
}
