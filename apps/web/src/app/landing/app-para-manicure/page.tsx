import type { Metadata } from "next";

import { SolutionPage, solutionMetadata } from "@/features/landing/solution-page";

export const metadata: Metadata = solutionMetadata("app-para-manicure");

export default function AppParaManicurePage() {
  return <SolutionPage slug="app-para-manicure" />;
}
