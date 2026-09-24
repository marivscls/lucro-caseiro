import type { Metadata } from "next";

import { SolutionPage, solutionMetadata } from "@/features/landing/solution-page";

export const metadata: Metadata = solutionMetadata("catalogo-digital-whatsapp");

export default function CatalogoDigitalWhatsappPage() {
  return <SolutionPage slug="catalogo-digital-whatsapp" />;
}
