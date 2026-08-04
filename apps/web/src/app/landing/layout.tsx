import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

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

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <div>
      <SiteAnalytics nonce={nonce} />
      {children}
    </div>
  );
}
