import { publicMetadata } from "@/features/landing/public-metadata";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { LandingPage, landingFaqs } from "@/features/landing/landing-page";
import {
  PLAY_STORE_URL,
  PWA_URL,
  SITE_URL,
  SOCIAL_LINKS,
} from "@/features/landing/site-constants";
import { PLAN_PRICING } from "@lucro-caseiro/contracts";

export const metadata: Metadata = publicMetadata({
  title: "App de precificação e vendas",
  description:
    "Calcule custos, inclua seu trabalho e saiba quanto sobra de cada venda. Organize vendas, fiado e catálogo. Grátis, com 7 dias do Essencial para testar.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Lucro Caseiro",
    title: "Lucro Caseiro. Preço certo. Venda pronta.",
    description:
      "Do custo à venda, sem chute e sem retrabalho. Comece grátis no Android.",
  },
  robots: { index: true, follow: true },
});

export default async function Page() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Lucro Caseiro",
    description:
      "Aplicativo para calcular preços e organizar produtos, catálogo, vendas e finanças de quem produz ou vende, do trabalho autônomo a negócios estruturados.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Android, Web",
    url: SITE_URL,
    sameAs: PWA_URL,
    installUrl: PLAY_STORE_URL,
    offers: [
      { "@type": "Offer", name: "Gratuito", price: "0", priceCurrency: "BRL" },
      {
        "@type": "Offer",
        name: "Essencial mensal",
        price: PLAN_PRICING.essential.monthly,
        priceCurrency: "BRL",
      },
      {
        "@type": "Offer",
        name: "Profissional mensal",
        price: PLAN_PRICING.professional.monthly,
        priceCurrency: "BRL",
      },
    ],
  };

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            schema,
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Lucro Caseiro",
              url: SITE_URL,
              inLanguage: "pt-BR",
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: landingFaqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ORIONSEVEN SOFTWARE",
              url: SITE_URL,
              logo: `${SITE_URL}/landing/logo.png`,
              email: "contato@orionseven.com.br",
              sameAs: SOCIAL_LINKS.map((social) => social.url),
            },
          ]),
        }}
      />
      <LandingPage />
    </>
  );
}
