import type { Metadata } from "next";

import { LandingPage } from "@/features/landing/landing-page";
import { PLAY_STORE_URL, SITE_URL } from "@/features/landing/site-constants";

export const metadata: Metadata = {
  title: "Preço certo. Venda pronta.",
  description:
    "Calcule o preço certo, saiba quanto sobra e transforme seu produto em catálogo ou venda sem cadastrar tudo de novo.",
  alternates: { canonical: "/landing" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Lucro Caseiro",
    title: "Lucro Caseiro — Preço certo. Venda pronta.",
    description:
      "Do custo à venda, sem chute e sem retrabalho. Comece grátis no Android.",
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Lucro Caseiro",
    description:
      "Aplicativo para calcular preços e organizar produtos, catálogo, vendas e finanças de quem produz ou vende, do trabalho autônomo a negócios estruturados.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Android",
    url: `${SITE_URL}/landing`,
    installUrl: PLAY_STORE_URL,
    offers: [
      { "@type": "Offer", name: "Gratuito", price: "0", priceCurrency: "BRL" },
      { "@type": "Offer", name: "Essencial", price: "29.90", priceCurrency: "BRL" },
      { "@type": "Offer", name: "Profissional", price: "69.90", priceCurrency: "BRL" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <LandingPage />
    </>
  );
}
