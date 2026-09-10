"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { describeCta } from "./analytics-events";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_ID;
const enabled = Boolean(measurementId && /^G-[A-Z0-9]+$/.test(measurementId));

function initialize() {
  window.dataLayer ??= [];
  window.gtag ??= function () {
    // Google's command queue requires an Arguments object, not a data-layer array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
}

export function trackLandingEvent(
  event: string,
  parameters: Record<string, string> = {},
) {
  if (!enabled) return;
  initialize();
  window.gtag!("event", event, parameters);
}

export function SiteAnalytics({ nonce }: { readonly nonce?: string }) {
  const pathname = usePathname();
  useEffect(() => {
    if (!enabled) return;
    initialize();
    window.gtag!("js", new Date());
    window.gtag!("config", measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Exclude query strings, fragments, form values and customer identifiers.
    const referrer = document.referrer ? new URL(document.referrer) : null;
    trackLandingEvent("page_view", {
      page_location: `${window.location.origin}${window.location.pathname}`,
      page_referrer: referrer ? `${referrer.origin}${referrer.pathname}` : "",
      page_title: document.title,
    });
    function trackClick(event: MouseEvent) {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-analytics]")
          : null;
      const label = target?.dataset.analytics;
      if (label) {
        const cta = describeCta(label);
        trackLandingEvent(cta.event, { placement: cta.placement });
        if (cta.placement === "calculator_result") {
          trackLandingEvent("calculator_to_app", {
            platform: cta.event === "start_web" ? "web" : "android",
          });
        }
      }
    }

    const section = document.getElementById("planos");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackLandingEvent("pricing_section_view");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    if (section) observer.observe(section);
    document.addEventListener("click", trackClick);
    return () => {
      document.removeEventListener("click", trackClick);
      observer.disconnect();
    };
  }, [pathname]);

  if (!enabled) return null;

  return (
    <>
      <Script
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
    </>
  );
}
