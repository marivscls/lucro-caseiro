import type { Metadata, Viewport } from "next";

import { SiteAnalytics } from "@/features/landing/site-analytics";

// A fonte canonica Nunito Sans e carregada no root e exposta como
// --font-sans para o app inteiro.

export const viewport: Viewport = {
  themeColor: "#FFFAF8",
  colorScheme: "light",
};

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SiteAnalytics />
      {children}
    </div>
  );
}
