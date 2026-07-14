import type { AnalyticsScreenName } from "@lucro-caseiro/contracts";
import { usePathname } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { useAuth } from "../../shared/hooks/use-auth";
import { activeDurationMs, analyticsScreenForPath } from "./screen-tracking";
import { trackAnalyticsEvent } from "./tracker";

export function useScreenMetrics(): void {
  const pathname = usePathname();
  const { token } = useAuth();
  const latestToken = useRef(token);
  const screen = useRef<AnalyticsScreenName | null>(null);
  const startedAt = useRef<number | null>(null);
  latestToken.current = token;

  const flush = useCallback(() => {
    const durationMs = activeDurationMs(startedAt.current, Date.now());
    const previousScreen = screen.current;
    startedAt.current = null;
    if (previousScreen && durationMs !== null) {
      void trackAnalyticsEvent(
        { type: "screen_view", name: previousScreen, durationMs },
        latestToken.current,
      );
    }
  }, []);

  useEffect(() => {
    flush();
    screen.current = analyticsScreenForPath(pathname);
    startedAt.current = AppState.currentState === "active" ? Date.now() : null;
  }, [flush, pathname]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        startedAt.current = Date.now();
      } else {
        flush();
      }
    });
    return () => {
      subscription.remove();
      flush();
    };
  }, [flush]);
}
