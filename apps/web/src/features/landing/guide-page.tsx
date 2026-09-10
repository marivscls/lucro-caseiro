import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";

import { PublicPage, publicPageStyles as styles } from "./public-page";
import { PUBLIC_PAGE_UPDATED, SITE_URL, SOCIAL_IMAGE } from "./site-constants";

const relatedGuides = [
  { slug: "como-calcular-preco-de-venda", title: "Como calcular o preço de venda" },
  { slug: "precificacao-para-confeitaria", title: "Precificação para confeitaria" },
  {
    slug: "como-colocar-mao-de-obra-no-preco",
    title: "Como colocar mão de obra no preço",
  },
];

type GuidePageProps = {
  readonly title: string;
  readonly description: string;
  readonly slug: string;
  readonly children: ReactNode;
};

export async function GuidePage({ title, description, slug, children }: GuidePageProps) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    inLanguage: "pt-BR",
    datePublished: "2026-07-16",
    dateModified:
      PUBLIC_PAGE_UPDATED[`/landing/guias/${slug}` as keyof typeof PUBLIC_PAGE_UPDATED],
    image: SOCIAL_IMAGE.url,
    mainEntityOfPage: `${SITE_URL}/landing/guias/${slug}`,
    author: {
      "@type": "Organization",
      name: "Equipe Lucro Caseiro",
      url: `${SITE_URL}/landing/suporte`,
    },
    publisher: { "@type": "Organization", name: "ORIONSEVEN SOFTWARE", url: SITE_URL },
  };

  return (
    <PublicPage
      eyebrow="Guia de precificação"
      title={title}
      description={description}
      updatedAt="10 de setembro de 2026"
    >
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            schema,
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: title,
                  item: `${SITE_URL}/landing/guias/${slug}`,
                },
              ],
            },
          ]),
        }}
      />
      <article className={styles.article}>
        <nav aria-label="Caminho da página" className={styles.breadcrumb}>
          <Link href="/">Início</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{title}</span>
        </nav>
        <p className={styles.byline}>
          Por <Link href="/landing/suporte">Equipe Lucro Caseiro</Link> · ORIONSEVEN
          SOFTWARE
        </p>
        {children}
        <h2>Para continuar aprendendo</h2>
        <ul>
          {relatedGuides
            .filter((guide) => guide.slug !== slug)
            .map((guide) => (
              <li key={guide.slug}>
                <Link href={`/landing/guias/${guide.slug}`}>{guide.title}</Link>
              </li>
            ))}
        </ul>
        <div className={styles.articleCta}>
          <div>
            <h2>Teste com um produto real</h2>
            <p>
              Use a calculadora gratuita e veja o custo, o preço e quanto pode sobrar.
            </p>
          </div>
          <Link href="/landing/calculadora" data-analytics={`calculator_from_${slug}`}>
            Abrir calculadora
          </Link>
        </div>
      </article>
    </PublicPage>
  );
}
