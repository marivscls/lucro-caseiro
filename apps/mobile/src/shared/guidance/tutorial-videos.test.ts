import { describe, expect, it } from "vitest";

import {
  getTutorialVideoForArea,
  getTutorialVideoUrl,
  resolveTutorialVideosBaseUrl,
  TUTORIAL_VIDEOS,
} from "./tutorial-videos";

describe("tutorial-videos", () => {
  it("normalizes valid base URLs and rejects empty or unsupported schemes", () => {
    expect(resolveTutorialVideosBaseUrl("https://cdn.exemplo.com/tutoriais///")).toBe(
      "https://cdn.exemplo.com/tutoriais",
    );
    expect(resolveTutorialVideosBaseUrl("http://localhost:8788/")).toBe(
      "http://localhost:8788",
    );
    expect(resolveTutorialVideosBaseUrl("/tutoriais/")).toBe("/tutoriais");
    expect(resolveTutorialVideosBaseUrl("   ")).toBeNull();
    expect(resolveTutorialVideosBaseUrl("sftp://exemplo.com/videos")).toBeNull();
    expect(resolveTutorialVideosBaseUrl()).toBeNull();
  });

  it("maps core guidance areas to their respective short tutorial videos", () => {
    const base = "https://proj.supabase.co/storage/v1/object/public/tutorials";

    expect(getTutorialVideoForArea("pricing", base)?.url).toBe(
      `${base}/tutorial-precificacao.mp4`,
    );
    expect(getTutorialVideoForArea("sales", base)?.url).toBe(
      `${base}/tutorial-vendas-fiado.mp4`,
    );
    expect(getTutorialVideoForArea("new_sale", base)?.url).toBe(
      `${base}/tutorial-vendas-fiado.mp4`,
    );
    expect(getTutorialVideoForArea("fiado", base)?.url).toBe(
      `${base}/tutorial-vendas-fiado.mp4`,
    );
    expect(getTutorialVideoForArea("agenda", base)?.url).toBe(
      `${base}/tutorial-agenda-encomendas.mp4`,
    );
    expect(getTutorialVideoForArea("finance", base)?.url).toBe(
      `${base}/tutorial-financeiro.mp4`,
    );
    expect(getTutorialVideoForArea("catalog", base)?.url).toBe(
      `${base}/tutorial-catalogo-vitrine.mp4`,
    );
    expect(getTutorialVideoForArea("materials", base)?.url).toBe(
      `${base}/tutorial-receitas-custos.mp4`,
    );
    expect(getTutorialVideoForArea("recipes", base)?.url).toBe(
      `${base}/tutorial-receitas-custos.mp4`,
    );
    expect(getTutorialVideoForArea("clients", base)).toBeNull();
  });

  it("hides video links cleanly when no base URL is configured or on another whitelabel brand", () => {
    expect(getTutorialVideoForArea("pricing", "")).toBeNull();
    expect(getTutorialVideoUrl(TUTORIAL_VIDEOS[0], "")).toBeNull();
    expect(
      resolveTutorialVideosBaseUrl("https://cdn.exemplo.com/tutoriais", "lucro-manicure"),
    ).toBeNull();
  });
});
