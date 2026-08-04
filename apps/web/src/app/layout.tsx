import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { headers } from "next/headers";

import "./globals.css";
import { BrandProvider } from "./brand-provider";
import { BrandThemeStyle } from "./brand-theme";
import { Providers } from "./providers";

// Tipografia canonica (ADR-0008): Nunito Sans em toda a interface.
// Espelha `fonts` de packages/ui/src/theme.ts.
const sans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700", "800"],
});
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://lucrocaseiro.com.br",
  ),
  title: { default: "Central de Marketing", template: "%s · Lucro Caseiro" },
  description: "Planejamento, documentos e inteligência de marketing do Lucro Caseiro.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#C4707E", colorScheme: "light" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR">
      <body className={sans.variable}>
        {/* Whitelabel (ADR-0009): overrides de CSS vars da marca ativa,
            aplicados sobre o globals.css (que segue sendo a base). */}
        <BrandThemeStyle nonce={nonce} />
        <BrandProvider>
          <Providers>{children}</Providers>
        </BrandProvider>
      </body>
    </html>
  );
}
