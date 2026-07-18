import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

// Tipografia canonica (ADR-0008): Fraunces para display/titulos,
// Nunito Sans para o texto corrido. Espelha `fonts` de packages/ui/src/theme.ts.
const sans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700", "800"],
});
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://lucrocaseiro.com.br",
  ),
  title: { default: "Central de Marketing", template: "%s · Lucro Caseiro" },
  description: "Planejamento, documentos e inteligência de marketing do Lucro Caseiro.",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#C4707E", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${sans.variable} ${display.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
