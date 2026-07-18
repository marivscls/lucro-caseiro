import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "./landing-page.module.css";
import { PLAY_STORE_URL, SUPPORT_EMAIL } from "./site-constants";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/landing" aria-label="Lucro Caseiro — início">
        <Image src="/landing/logo.png" width={48} height={48} alt="" priority />
        <span>Lucro Caseiro</span>
      </Link>
      <nav className={styles.nav} aria-label="Navegação principal">
        <Link href="/landing#como-funciona">Como funciona</Link>
        <Link href="/landing/calculadora">Calculadora</Link>
        <Link href="/landing#planos">Planos</Link>
        <Link href="/landing/suporte">Ajuda</Link>
      </nav>
      <a
        className={styles.headerCta}
        href={PLAY_STORE_URL}
        data-analytics="play_store_header"
      >
        Começar grátis
        <ArrowRight aria-hidden="true" size={18} />
      </a>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBrand}>
        <Image src="/landing/logo.png" width={44} height={44} alt="" />
        <span>
          <strong>Lucro Caseiro</strong>Preço certo. Venda pronta.
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
