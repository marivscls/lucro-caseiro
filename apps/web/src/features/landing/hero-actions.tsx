"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import styles from "./landing-page.module.css";
import { playStoreUrl, pwaUrl } from "./site-constants";

/** Android vê a Play Store primeiro; iPhone e computador, o app no navegador. */
export function prefersBrowserApp(userAgent: string): boolean {
  return !/android/i.test(userAgent);
}

/** Destino do botão "Começar grátis" e o link alternativo, conforme o aparelho. */
export function startDestinations(placement: string, browserFirst: boolean) {
  const play = {
    href: playStoreUrl(`play_store_${placement}`),
    analytics: `play_store_${placement}`,
    label: "ou baixe no Google Play",
    primaryLabel: "Baixar grátis no Google Play",
  };
  const browser = {
    href: pwaUrl(`pwa_${placement}`),
    analytics: `pwa_${placement}`,
    label: "ou use no navegador, sem instalar",
    primaryLabel: "Começar grátis no navegador",
  };
  return browserFirst
    ? { primary: browser, alternative: play }
    : { primary: play, alternative: browser };
}

function useBrowserFirst(): boolean {
  // Sem JavaScript, o app no navegador funciona em qualquer aparelho.
  const [browserFirst, setBrowserFirst] = useState(true);
  useEffect(() => {
    setBrowserFirst(prefersBrowserApp(navigator.userAgent));
  }, []);
  return browserFirst;
}

type StartCtaProps = {
  /** Posição do botão, vira `utm_content` e o rótulo de analytics. */
  readonly placement: string;
  readonly label?: string;
  readonly buttonClassName?: string;
  readonly alternativeClassName?: string;
  readonly className?: string;
  readonly showAlternative?: boolean;
  readonly children?: ReactNode;
};

/**
 * Um único botão principal: leva à Play Store no Android e ao app no navegador
 * no iPhone e no computador. O outro caminho fica como link discreto.
 */
export function StartCta({
  placement,
  label,
  buttonClassName = styles.primaryCta,
  alternativeClassName = styles.startAlternative,
  className = styles.startCta,
  showAlternative = true,
  children,
}: StartCtaProps) {
  const { primary, alternative } = startDestinations(placement, useBrowserFirst());
  return (
    <div className={className}>
      <a
        className={buttonClassName}
        data-pointer-ripple
        href={primary.href}
        data-analytics={primary.analytics}
      >
        {label ?? primary.primaryLabel}
        {children === undefined ? <ArrowRight aria-hidden="true" size={18} /> : children}
      </a>
      {showAlternative ? (
        <a
          className={alternativeClassName}
          href={alternative.href}
          data-analytics={alternative.analytics}
        >
          {alternative.label}
        </a>
      ) : null}
    </div>
  );
}

export function HeroActions() {
  return <StartCta placement="hero" className={styles.heroActions} />;
}
