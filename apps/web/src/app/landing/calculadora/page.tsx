import type { Metadata } from "next";

import { PriceCalculator } from "@/features/landing/price-calculator";
import { PublicPage } from "@/features/landing/public-page";

export const metadata: Metadata = {
  title: "Calculadora gratuita de preço de venda",
  description:
    "Some materiais, embalagem, mão de obra, custos fixos, margem e taxas para descobrir um preço de venda mais seguro.",
  alternates: { canonical: "/landing/calculadora" },
};

export default function CalculatorPage() {
  return (
    <PublicPage
      eyebrow="Simulação gratuita"
      title="Quanto você deveria cobrar?"
      description="Faça uma primeira conta com todos os custos. Não precisa criar conta e nenhum valor é salvo."
      wide
    >
      <PriceCalculator />
    </PublicPage>
  );
}
