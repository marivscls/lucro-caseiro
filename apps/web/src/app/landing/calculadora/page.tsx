import type { Metadata } from "next";

import { PriceCalculator } from "@/features/landing/price-calculator";
import { SiteFooter, SiteHeader } from "@/features/landing/site-chrome";
import landingStyles from "@/features/landing/landing-page.module.css";
import styles from "@/features/landing/price-calculator.module.css";

export const metadata: Metadata = {
  title: "Calculadora gratuita de preço de venda",
  description:
    "Calcule seu preço de venda com materiais, embalagem, seu tempo e custos fixos. Veja quanto sobra por unidade, com as taxas incluídas. Grátis e sem cadastro.",
  alternates: { canonical: "/landing/calculadora" },
};

export default function CalculatorPage() {
  return (
    <div className={landingStyles.page}>
      <SiteHeader />
      <main id="conteudo" className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Calculadora de preço de venda</p>
          <h1>
            Seu trabalho tem valor.
            <br />
            <span>Coloque ele na conta.</span>
          </h1>
          <div className={styles.heroBottom}>
            <p>
              Some os custos, inclua seu tempo e descubra um preço que deixe espaço para o
              lucro.
            </p>
            <span className={styles.freeNote}>
              Grátis. Sem cadastro.
              <br /> O resultado muda enquanto você preenche.
            </span>
          </div>
        </header>
        <PriceCalculator />
      </main>
      <SiteFooter />
    </div>
  );
}
