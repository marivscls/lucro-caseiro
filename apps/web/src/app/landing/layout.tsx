import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { headers } from "next/headers";

import { SiteAnalytics } from "@/features/landing/site-analytics";

// Site público segue a tipografia oficial do app (ADR-0008): Manrope.
// A variável --font-sans é redefinida só nesta subárvore; a Central de
// Marketing continua com a fonte carregada no RootLayout.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4A2332",
  colorScheme: "light",
};

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <div className={manrope.variable}>
      <SiteAnalytics nonce={nonce} />
      {children}
    </div>
  );
}
