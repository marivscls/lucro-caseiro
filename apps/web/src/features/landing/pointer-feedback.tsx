"use client";

import { useEffect } from "react";
import styles from "./pointer-feedback.module.css";

// Adapted from Magic UI's MIT-licensed Ripple Button. See EFFECTS-SOURCES.md.
export function PointerFeedback() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const waves = new Map<Animation, HTMLSpanElement>();
    const clear = () => {
      waves.forEach((wave, animation) => {
        animation.cancel();
        wave.remove();
      });
      waves.clear();
    };
    const ripple = (event: PointerEvent) => {
      if (preference.matches || event.button !== 0 || !event.isPrimary) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const host = target.closest<HTMLElement>("[data-pointer-ripple]");
      if (!host || !host.animate || host.matches(":disabled, [aria-disabled='true']"))
        return;

      // Each press owns its wave; a second press never restarts an existing one.
      if (waves.size >= 4) clear();
      const rect = host.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const radius = Math.hypot(
        Math.max(x, rect.width - x),
        Math.max(y, rect.height - y),
      );
      const wave = document.createElement("span");
      wave.className = styles.wave ?? "";
      wave.setAttribute("aria-hidden", "true");
      wave.style.left = `${x - 12}px`;
      wave.style.top = `${y - 12}px`;
      host.append(wave);
      const animation = wave.animate(
        [
          { transform: "scale(0.95)", opacity: 0.18 },
          { transform: `scale(${radius / 12})`, opacity: 0 },
        ],
        {
          duration: 280,
          easing: getComputedStyle(host).getPropertyValue("--ease-out").trim(),
        },
      );
      waves.set(animation, wave);
      const remove = () => {
        wave.remove();
        waves.delete(animation);
      };
      animation.onfinish = remove;
      animation.oncancel = remove;
    };
    document.addEventListener("pointerdown", ripple, { passive: true });
    document.addEventListener("keydown", clear);
    preference.addEventListener("change", clear);
    return () => {
      clear();
      document.removeEventListener("pointerdown", ripple);
      document.removeEventListener("keydown", clear);
      preference.removeEventListener("change", clear);
    };
  }, []);
  return null;
}
