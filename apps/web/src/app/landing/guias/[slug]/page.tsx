import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  findGuideArticle,
  loadGuideArticles,
  paragraphs,
} from "@/features/landing/guide-articles";
import { GuidePage } from "@/features/landing/guide-page";
import { publicPageStyles as styles } from "@/features/landing/public-page";
import { publicMetadata } from "@/features/landing/public-metadata";

// Só os guias que existem no build viram página; qualquer outro endereço é 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return loadGuideArticles().map((article) => ({ slug: article.slug }));
}

type Params = { readonly params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const article = findGuideArticle((await params).slug);
  if (!article) return {};
  return publicMetadata({
    title: article.title,
    description: article.description,
    alternates: { canonical: `/landing/guias/${article.slug}` },
  });
}

export default async function GeneratedGuidePage({ params }: Params) {
  const article = findGuideArticle((await params).slug);
  if (!article) notFound();
  const faqSchema = article.faq.length
    ? [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        },
      ]
    : [];

  return (
    <GuidePage
      title={article.title}
      description={article.description}
      slug={article.slug}
      publishedAt={article.publishedAt}
      extraSchema={faqSchema}
    >
      <p className={styles.articleLead}>{article.description}</p>
      {article.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {paragraphs(section.body).map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </section>
      ))}
      {article.faq.length > 0 && (
        <section>
          <h2>Perguntas frequentes</h2>
          {article.faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>
      )}
    </GuidePage>
  );
}
