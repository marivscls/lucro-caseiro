import { Check, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";

import { ESSENTIAL_TRIAL_DAYS } from "@lucro-caseiro/contracts";

import { StartCta } from "./hero-actions";
import landingStyles from "./landing-page.module.css";
import { publicMetadata } from "./public-metadata";
import { SiteFooter, SiteHeader, SupportWhatsApp } from "./site-chrome";
import { SITE_URL } from "./site-constants";
import {
  SOLUTION_LABELS,
  SOLUTIONS,
  type SolutionContent,
  type SolutionSlug,
} from "./solution-content";
import styles from "./solution-page.module.css";

export function solutionPath(slug: SolutionSlug): string {
  return `/landing/${slug}`;
}

export function solutionMetadata(slug: SolutionSlug): Metadata {
  const page = SOLUTIONS[slug];
  return publicMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: solutionPath(slug) },
  });
}

function solutionSchema(page: SolutionContent) {
  const url = `${SITE_URL}${solutionPath(page.slug)}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: SOLUTION_LABELS[page.slug], item: url },
      ],
    },
  ];
}

export async function SolutionPage({ slug }: { readonly slug: SolutionSlug }) {
  const page = SOLUTIONS[slug];
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const placement = slug.replace(/-/g, "_");

  return (
    <div className={landingStyles.page}>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(solutionSchema(page)) }}
      />
      <SiteHeader />
      <main id="conteudo" className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <nav aria-label="Caminho da página" className={styles.breadcrumb}>
              <Link href="/">Início</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{SOLUTION_LABELS[slug]}</span>
            </nav>
            <p className={styles.eyebrow}>{page.eyebrow}</p>
            <h1>{page.title}</h1>
            <p className={styles.lead}>{page.lead}</p>
            <StartCta
              placement={placement}
              className={styles.actions}
              buttonClassName={landingStyles.primaryCta}
              alternativeClassName={styles.alternative}
            />
            <p className={styles.note}>
              <Check aria-hidden="true" size={18} />
              Grátis para começar, com {ESSENTIAL_TRIAL_DAYS} dias do Essencial sem cartão
            </p>
          </div>
          <aside className={styles.example} aria-label="Exemplo ilustrativo">
            <p className={styles.exampleHeading}>{page.example.heading}</p>
            <dl>
              {page.example.rows.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className={styles.exampleTotal}>
              <span>{page.example.totalLabel}</span>
              <strong>{page.example.total}</strong>
            </div>
            <p className={styles.exampleNote}>Exemplo ilustrativo</p>
          </aside>
        </section>

        <section className={styles.benefits} aria-label="Por que usar">
          {page.benefits.map((benefit) => (
            <article key={benefit.title}>
              <h2>{benefit.title}</h2>
              <p>{benefit.text}</p>
            </article>
          ))}
        </section>

        <section className={styles.how}>
          <div className={styles.shot}>
            <Image
              src={page.image.src}
              alt={page.image.alt}
              width={1080}
              height={2400}
              sizes="(max-width: 760px) 240px, 300px"
            />
          </div>
          <div>
            <h2>Como funciona</h2>
            <ol className={styles.steps}>
              {page.steps.map((step, index) => (
                <li key={step}>
                  <span aria-hidden="true">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.faq}>
          <h2>Dúvidas</h2>
          {page.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>
                {faq.question}
                <ChevronDown aria-hidden="true" size={20} strokeWidth={2} />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>

        <nav className={styles.related} aria-label="Veja também">
          <h2>Veja também</h2>
          <div>
            {page.related.map((related) => (
              <Link key={related} href={solutionPath(related)}>
                {SOLUTION_LABELS[related]}
              </Link>
            ))}
            <Link href="/landing/calculadora">Calculadora de preço grátis</Link>
          </div>
        </nav>

        <section className={landingStyles.finalCta}>
          <div>
            <h2>
              Comece hoje.
              <em>Grátis, no celular ou no computador.</em>
            </h2>
            <p>Crie a conta em poucos minutos. Sem cartão e sem compromisso.</p>
          </div>
          <StartCta
            placement={`${placement}_final`}
            className={landingStyles.finalActions}
            buttonClassName={landingStyles.finalButton}
            alternativeClassName={landingStyles.secondaryCta}
          />
        </section>
      </main>
      <SiteFooter />
      <SupportWhatsApp />
    </div>
  );
}
