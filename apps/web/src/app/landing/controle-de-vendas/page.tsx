import type { Metadata } from "next";

import { SolutionPage, solutionMetadata } from "@/features/landing/solution-page";

export const metadata: Metadata = solutionMetadata("controle-de-vendas");

export default function ControleDeVendasPage() {
  return <SolutionPage slug="controle-de-vendas" />;
}
