import type { Metadata } from "next";

import { SolutionPage, solutionMetadata } from "@/features/landing/solution-page";

export const metadata: Metadata = solutionMetadata("controle-de-fiado");

export default function ControleDeFiadoPage() {
  return <SolutionPage slug="controle-de-fiado" />;
}
