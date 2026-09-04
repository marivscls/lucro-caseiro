"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createProductJourney } from "./product-journey-motion";

/** Content remains visible before hydration and when motion is unavailable. */
export function LandingMotion({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window) || !element.animate) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopJourney = createProductJourney(element);
    const animations = new Set<Animation>();
    const easing = getComputedStyle(element).getPropertyValue("--ease-out").trim();
    let stopped = preference.matches;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (stopped) continue;
          const target = entry.target as HTMLElement;
          const kind = target.dataset.motionKind;
          const entrance = "translateY(48px) scale(0.97)";
          if (kind === "step") target.dataset.motionEntered = "true";
          const animation = target.animate(
            [
              { opacity: 0.1, transform: entrance },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: 1400,
              delay: Number(target.dataset.landingReveal) || 0,
              easing,
              fill: "backwards",
            },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
          animation.oncancel = () => animations.delete(animation);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
    );

    // Keyboard navigation and preference changes always reveal content immediately.
    const stop = () => {
      stopJourney();
      stopped = true;
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    if (!stopped) {
      element.querySelectorAll<HTMLElement>("[data-landing-reveal]").forEach((target) => {
        if (target.getBoundingClientRect().top >= window.innerHeight)
          observer.observe(target);
      });
    }
    element.addEventListener("keydown", stop);
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.matches(":focus-visible"))
        stop();
    };
    element.addEventListener("focusin", onFocus);
    preference.addEventListener("change", stop);
    return () => {
      stop();
      element.removeEventListener("keydown", stop);
      element.removeEventListener("focusin", onFocus);
      preference.removeEventListener("change", stop);
    };
  }, []);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
