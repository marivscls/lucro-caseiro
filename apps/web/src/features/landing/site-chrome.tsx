import { ArrowRight, ChevronDown, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "./landing-page.module.css";
import { StartCta } from "./hero-actions";
import { PointerFeedback } from "./pointer-feedback";
import {
  playStoreUrl,
  pwaUrl,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
  WHATSAPP_URL,
} from "./site-constants";

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
        <Link className={styles.brand} href="/" aria-label="Lucro Caseiro, início">
          <Image src="/landing/logo.png" width={40} height={40} alt="" priority />
          <span>lucro caseiro</span>
        </Link>
        <nav className={styles.nav} aria-label="Navegação principal">
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/landing/calculadora">Calculadora</Link>
          <Link href="/#planos">Planos</Link>
          <Link href="/landing/suporte">Ajuda</Link>
          <a href={pwaUrl("pwa_header")} data-analytics="pwa_header">
            Usar no navegador
          </a>
        </nav>
        <details className={styles.mobileMenu}>
          <summary>
            Menu <ChevronDown aria-hidden="true" size={18} />
          </summary>
          <nav aria-label="Navegação no celular">
            <Link href="/#como-funciona">Como funciona</Link>
            <Link href="/landing/calculadora">Calculadora</Link>
            <Link href="/#planos">Planos</Link>
            <Link href="/landing/suporte">Ajuda</Link>
            <a href={pwaUrl("pwa_mobile_menu")} data-analytics="pwa_mobile_menu">
              Usar no navegador
            </a>
            <a
              href={playStoreUrl("play_store_mobile_menu")}
              data-analytics="play_store_mobile_menu"
            >
              Baixar no Google Play
            </a>
          </nav>
        </details>
        <StartCta
          placement="header"
          className={styles.headerCtaWrap}
          buttonClassName={styles.headerCta}
          showAlternative={false}
        >
          {onWine ? null : <CtaArrow />}
        </StartCta>
      </header>
    </>
  );
}

const footerColumns = [
  {
    title: "Venda",
    links: [
      { href: "/landing/calculadora", label: "Calculadora de preço" },
      { href: "/landing/catalogo-digital-whatsapp", label: "Catálogo no WhatsApp" },
      { href: "/landing/controle-de-vendas", label: "Controle de vendas" },
    ],
  },
  {
    title: "Organize",
    links: [
      { href: "/landing/controle-de-fiado", label: "Controle de fiado" },
      { href: "/landing/guias/como-calcular-preco-de-venda", label: "Guias de preço" },
      { href: "/#planos", label: "Planos" },
    ],
  },
  {
    title: "Para quem",
    links: [
      { href: "/landing/app-para-confeitaria", label: "Confeitaria" },
      { href: "/landing/app-para-marmita", label: "Marmitas" },
      { href: "/landing/app-para-manicure", label: "Manicure e beleza" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <Image src="/landing/logo.png" width={40} height={40} alt="" />
          <span>
            <strong>lucro caseiro</strong>
            Preço certo. Venda pronta.
          </span>
        </div>
        <nav className={styles.footerColumns} aria-label="Mais páginas">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p>{column.title}</p>
              {column.links.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
          <div>
            <p>Ajuda</p>
            <Link href="/landing/suporte">Central de ajuda</Link>
            {WHATSAPP_URL ? (
              <a href={WHATSAPP_URL} rel="noopener noreferrer" target="_blank">
                WhatsApp
              </a>
            ) : null}
            <a href={`mailto:${SUPPORT_EMAIL}`}>Contato por e-mail</a>
          </div>
        </nav>
      </div>
      <div className={styles.footerBottom}>
        <div className={styles.footerLinks}>
          <Link href="/landing/privacidade">Privacidade</Link>
          <Link href="/landing/termos">Termos</Link>
          <Link href="/landing/excluir-conta">Excluir conta</Link>
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.url}
              href={social.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {social.name}
            </a>
          ))}
        </div>
        <p>© {new Date().getFullYear()} Lucro Caseiro · ORIONSEVEN SOFTWARE.</p>
      </div>
    </footer>
  );
}

/** Botão flutuante de atendimento. Só aparece com o número configurado. */
export function SupportWhatsApp() {
  if (!WHATSAPP_URL) return null;
  return (
    <a
      className={styles.whatsappFloat}
      href={WHATSAPP_URL}
      rel="noopener noreferrer"
      target="_blank"
      data-analytics="whatsapp_float"
    >
      <MessageCircle aria-hidden="true" size={22} />
      Tire sua dúvida
    </a>
  );
}
