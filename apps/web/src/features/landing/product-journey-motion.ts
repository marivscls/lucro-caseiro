import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * A linha que liga os três passos se desenha com a rolagem e cada captura sobe
 * dentro do seu painel. Rolagem nativa, sem palco fixo; sem JavaScript ou com
 * movimento reduzido, tudo já aparece no estado final.
 */
export function createProductJourney(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  const journey = root.querySelector<HTMLElement>("[data-product-journey]");
  if (!journey) return () => media.revert();

  media.add(
    {
      motion: "(prefers-reduced-motion: no-preference)",
      // Lado a lado a linha é horizontal; empilhados, vira um trilho vertical.
      wide: "(min-width: 900px)",
    },
    (context) => {
      if (!context.conditions?.motion) return;
      const wide = Boolean(context.conditions.wide);
      const screens = Array.from(
        journey.querySelectorAll<HTMLElement>("[data-journey-screen]"),
      );
      const marks = Array.from(
        journey.querySelectorAll<HTMLElement>("[data-journey-mark]"),
      );
      if (screens.length !== 3 || marks.length !== 3) return;

      const styles = getComputedStyle(journey);
      const lit = {
        backgroundColor: styles.getPropertyValue("--wine").trim(),
        color: styles.getPropertyValue("--on-wine").trim(),
      };
      const dim = {
        backgroundColor: styles.getPropertyValue("--line").trim(),
        color: styles.getPropertyValue("--wine").trim(),
      };

      // Posição (0 a 2) em que a linha alcança cada passo.
      const line = journey.querySelector<HTMLElement>(
        "[data-journey-progress]",
      )?.parentElement;
      const reach = (target: HTMLElement) => {
        if (wide || !line) return null;
        const rail = line.getBoundingClientRect();
        if (rail.height === 0) return null;
        const offset = target.getBoundingClientRect().top - rail.top;
        return Math.min(2, Math.max(0, (2 * offset) / rail.height));
      };
      const markAt = [0, reach(marks[1]!) ?? 0.95, reach(marks[2]!) ?? 1.9];
      const screenAt = screens.map((screen, index) => {
        const stacked = reach(screen);
        return stacked === null ? 0.5 + index * 0.3 : Math.max(0, stacked - 0.45);
      });

      gsap.set(journey, { "--journey-progress": 0 });
      gsap.set(marks.slice(1), dim);
      gsap.set(screens, { y: 40 });

      const story = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: journey,
          start: wide ? "top 70%" : "top 55%",
          end: wide ? "bottom 85%" : "bottom 70%",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      story.to(journey, { "--journey-progress": 1, duration: 2 }, 0);
      screens.forEach((screen, index) => {
        story.to(screen, { y: 0, duration: 0.6, ease: "power2.out" }, screenAt[index]);
      });
      story
        .to(marks[1]!, { ...lit, duration: 0.12 }, markAt[1])
        .to(marks[2]!, { ...lit, duration: 0.12 }, markAt[2]);
    },
    root,
  );
  return () => media.revert();
}
