import type { Metadata } from "next";

import { PageHeader } from "@/features/marketing/page-header";
import { VideoPromptStudio } from "@/features/marketing/video-prompt-studio";

export const metadata: Metadata = { title: "Prompts de vídeo" };

export default async function VideoPromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="Estúdio de Prompts de Vídeo"
        title="Prompts de vídeo"
        description="Crie uma influenciadora consistente e transforme a identidade salva em prompts completos para fotos e vídeos."
      />
      <VideoPromptStudio
        initialFocus={focus === "influencer" ? "influencer" : undefined}
      />
    </>
  );
}
