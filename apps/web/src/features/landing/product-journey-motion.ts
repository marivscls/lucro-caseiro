import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** A native sticky scene; ScrollTrigger scrubs the story without capturing scroll. */
export function createProductJourney(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  const journey = root.querySelector<HTMLElement>("[data-product-journey]");
  if (!journey) return () => media.revert();

  media.add(
    "(min-height: 700px) and (prefers-reduced-motion: no-preference)",
    () => {
      const screens = Array.from(
        journey.querySelectorAll<HTMLElement>("[data-journey-screen]"),
      );
      const chapters = Array.from(
        journey.querySelectorAll<HTMLElement>("[data-journey-chapter]"),
      );
      if (screens.length !== 3 || chapters.length !== 3) return;
      journey.dataset.journeyReady = "true";
      const progress = journey.querySelector("[data-journey-progress]");
      const captions = screens.map((screen) => screen.querySelector("figcaption"));
      gsap.set(captions.slice(1), { opacity: 0 });
      gsap.set(screens[0]!, { transform: "translate3d(0, 0, 0) rotate(-6deg)" });
      gsap.set(screens[1]!, {
        transform: "translate3d(18%, 8%, 0) rotate(8deg) scale(0.95)",
      });
      gsap.set(screens[2]!, {
        transform: "translate3d(35%, 15%, 0) rotate(15deg) scale(0.9)",
      });
      gsap.set(chapters.slice(1), { opacity: 0, transform: "translateY(32px)" });
      gsap.set(progress, { scaleX: 0.04, transformOrigin: "left center" });

      const story = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: journey,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.6,
          invalidateOnRefresh: true,
        },
      });
      story
        .to(progress, { scaleX: 1, duration: 5 }, 0)
        .to(captions[0]!, { opacity: 0, duration: 0.35 }, 1)
        .to(captions[1]!, { opacity: 1, duration: 0.6 }, 1.35)
        .to(captions[1]!, { opacity: 0, duration: 0.35 }, 3)
        .to(captions[2]!, { opacity: 1, duration: 0.6 }, 3.35)
        .to(
          screens[0]!,
          {
            transform: "translate3d(-65%, -12%, 0) rotate(-18deg) scale(0.88)",
            opacity: 0,
            duration: 1,
          },
          1,
        )
        .to(
          screens[1]!,
          { transform: "translate3d(0, 0, 0) rotate(0deg) scale(1)", duration: 1 },
          1,
        )
        .to(
          chapters[0]!,
          { opacity: 0, transform: "translateY(-32px)", duration: 0.35 },
          1,
        )
        .to(chapters[1]!, { opacity: 1, transform: "translateY(0)", duration: 0.6 }, 1.35)
        .to(screens[0]!, { opacity: 0, duration: 0.5 }, 3)
        .to(
          screens[1]!,
          {
            transform: "translate3d(-65%, -12%, 0) rotate(-18deg) scale(0.88)",
            opacity: 0,
            duration: 1,
          },
          3,
        )
        .to(
          screens[2]!,
          { transform: "translate3d(0, 0, 0) rotate(0deg) scale(1)", duration: 1 },
          3,
        )
        .to(
          chapters[1]!,
          { opacity: 0, transform: "translateY(-32px)", duration: 0.35 },
          3,
        )
        .to(
          chapters[2]!,
          { opacity: 1, transform: "translateY(0)", duration: 0.6 },
          3.35,
        );

      return () => {
        delete journey.dataset.journeyReady;
      };
    },
    root,
  );
  return () => media.revert();
}
