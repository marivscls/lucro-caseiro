import type { ReactNode } from "react";
import Link from "next/link";

import { PublicPage, publicPageStyles as styles } from "./public-page";
import { SITE_URL } from "./site-constants";

type GuidePageProps = {
  readonly title: string;
  readonly description: string;
  readonly slug: string;
  readonly children: ReactNode;
};

export function GuidePage({ title, description, slug, children }: GuidePageProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    inLanguage: "pt-BR",
    datePublished: "2026-07-16",
    dateModified: "2026-07-16",
    mainEntityOfPage: `${SITE_URL}/landing/guias/${slug}`,
    author: { "@type": "Organization", name: "Lucro Caseiro" },
    publisher: { "@type": "Organization", name: "Lucro Caseiro" },
  };

  return (
    <PublicPage eyebrow="Guia de precificação" title={title} description={description}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <article className={styles.article}>
        {children}
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
