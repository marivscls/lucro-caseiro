import type { Metadata } from "next";
import { SOCIAL_IMAGE, SITE_URL } from "./site-constants";

export function publicMetadata(
  metadata: Metadata & { alternates: { canonical: string } },
): Metadata {
  const title = typeof metadata.title === "string" ? metadata.title : "Lucro Caseiro";
  const description =
    metadata.description ??
    "Calcule preços e organize suas vendas no Android e no navegador.";
  return {
    ...metadata,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "Lucro Caseiro",
      ...metadata.openGraph,
      title,
      description,
      url: new URL(metadata.alternates.canonical, SITE_URL).href,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SOCIAL_IMAGE.url],
    },
  };
}
