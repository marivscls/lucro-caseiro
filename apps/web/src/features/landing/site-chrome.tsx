import { ArrowRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "./landing-page.module.css";
import { PointerFeedback } from "./pointer-feedback";
import { PLAY_STORE_URL, PWA_URL, SUPPORT_EMAIL } from "./site-constants";

function CtaArrow() {
  return (
    <span className={styles.ctaGlyph} aria-hidden="true">
      <ArrowRight size={16} strokeWidth={2} />
    </span>
  );
}

type SiteHeaderProps = {
  /**
   * `paper`: barra flutuante sobre o fundo creme (páginas internas).
   * `wine`: barra em fluxo dentro da faixa vinho do hero da landing.
   */
  readonly tone?: "paper" | "wine";
};

export function SiteHeader({ tone = "paper" }: SiteHeaderProps) {
  const onWine = tone === "wine";
  return (
    <>
      <PointerFeedback />
      <a className={styles.skip} href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className={onWine ? styles.headerWine : styles.header}>
        <Link className={styles.brand} href="/landing" aria-label="Lucro Caseiro, início">
          <Image src="/landing/logo.png" width={40} height={40} alt="" priority />
          <span>lucro caseiro</span>
        </Link>
        <nav className={styles.nav} aria-label="Navegação principal">
          <Link href="/landing#como-funciona">Como funciona</Link>
          <Link href="/landing/calculadora">Calculadora</Link>
          <Link href="/landing#planos">Planos</Link>
          <Link href="/landing/suporte">Ajuda</Link>
          <a href={PWA_URL} data-analytics="pwa_header">
            Usar no navegador
          </a>
        </nav>
        <details className={styles.mobileMenu}>
          <summary>
            Menu <ChevronDown aria-hidden="true" size={18} />
          </summary>
          <nav aria-label="Navegação no celular">
            <Link href="/landing#como-funciona">Como funciona</Link>
            <Link href="/landing/calculadora">Calculadora</Link>
            <Link href="/landing#planos">Planos</Link>
            <Link href="/landing/suporte">Ajuda</Link>
            <a href={PWA_URL} data-analytics="pwa_mobile_menu">
              Usar no navegador
            </a>
            <a href={PLAY_STORE_URL} data-analytics="play_store_mobile_menu">
              Baixar no Google Play
            </a>
          </nav>
        </details>
        <a
          className={styles.headerCta}
          data-pointer-ripple
          href={PLAY_STORE_URL}
          data-analytics="play_store_header"
        >
          {onWine ? "Baixar grátis" : "Baixar no Google Play"}
          {onWine ? null : <CtaArrow />}
        </a>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBrand}>
        <Image src="/landing/logo.png" width={40} height={40} alt="" />
        <span>
          <strong>lucro caseiro</strong>
          Preço certo. Venda pronta.
        </span>
      </div>
      <div className={styles.footerLinks}>
        <Link href="/landing/privacidade">Privacidade</Link>
        <Link href="/landing/termos">Termos</Link>
        <Link href="/landing/excluir-conta">Excluir conta</Link>
        <a href={`mailto:${SUPPORT_EMAIL}`}>Contato</a>
      </div>
      <p>© {new Date().getFullYear()} Lucro Caseiro.</p>
    </footer>
  );
}
