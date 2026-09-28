import type { Metadata } from "next";

import { SolutionPage, solutionMetadata } from "@/features/landing/solution-page";

export const metadata: Metadata = solutionMetadata("app-para-confeitaria");

export default function AppParaConfeitariaPage() {
  return <SolutionPage slug="app-para-confeitaria" />;
}
