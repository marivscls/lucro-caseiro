import type { Metadata } from "next";

import { SolutionPage, solutionMetadata } from "@/features/landing/solution-page";

export const metadata: Metadata = solutionMetadata("app-para-marmita");

export default function AppParaMarmitaPage() {
  return <SolutionPage slug="app-para-marmita" />;
}
