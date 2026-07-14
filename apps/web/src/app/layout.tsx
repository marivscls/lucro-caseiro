import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "Central de Marketing", template: "%s · Lucro Caseiro" },
  description: "Planejamento, documentos e inteligência de marketing do Lucro Caseiro.",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#173f35", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${sans.variable} ${display.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
