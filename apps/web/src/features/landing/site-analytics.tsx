"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_ID;

export function SiteAnalytics({ nonce }: { readonly nonce?: string }) {
  useEffect(() => {
    function trackClick(event: MouseEvent) {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-analytics]")
          : null;
      const eventName = target?.dataset.analytics;
      if (eventName) {
        window.gtag?.("event", eventName, {
          link_url: target instanceof HTMLAnchorElement ? target.href : undefined,
        });
      }
    }

    document.addEventListener("click", trackClick);
    return () => document.removeEventListener("click", trackClick);
  }, []);

  if (!measurementId) return null;

  return (
    <>
      <Script
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="lucro-caseiro-ga" strategy="afterInteractive" nonce={nonce}>
        {`window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config','${measurementId}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
