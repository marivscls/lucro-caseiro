import type { Metadata } from "next";

import { SolutionPage, solutionMetadata } from "@/features/landing/solution-page";

export const metadata: Metadata = solutionMetadata("relatorio-mensal-mei");

export default function RelatorioMensalMeiPage() {
  return <SolutionPage slug="relatorio-mensal-mei" />;
}
