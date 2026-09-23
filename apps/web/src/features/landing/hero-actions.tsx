"use client";

import { ArrowRight, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "./landing-page.module.css";
import { playStoreUrl, pwaUrl } from "./site-constants";

/** Android vê a Play Store primeiro; iPhone e computador, o app no navegador. */
export function prefersBrowserApp(userAgent: string): boolean {
  return !/android/i.test(userAgent);
}

export function HeroActions() {
  const [browserFirst, setBrowserFirst] = useState(false);

  useEffect(() => {
    setBrowserFirst(prefersBrowserApp(navigator.userAgent));
  }, []);

  const play = (
    <a
      key="play"
      className={browserFirst ? styles.secondaryCta : styles.primaryCta}
      data-pointer-ripple={browserFirst ? undefined : true}
      href={playStoreUrl("play_store_hero")}
      data-analytics="play_store_hero"
    >
      <Smartphone aria-hidden="true" size={20} />
      Baixar no Google Play
    </a>
  );
  const browser = (
    <a
      key="pwa"
      className={browserFirst ? styles.primaryCta : styles.secondaryCta}
      data-pointer-ripple={browserFirst ? true : undefined}
      href={pwaUrl("pwa_hero")}
      data-analytics="pwa_hero"
    >
      Usar no navegador
      <ArrowRight aria-hidden="true" size={18} />
    </a>
  );

  return (
    <div className={styles.heroActions}>
      {browserFirst ? [browser, play] : [play, browser]}
    </div>
  );
}
