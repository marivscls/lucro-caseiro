import type { Session } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { supabase } from "./supabase";
import { supportedImageMimeFromBytes, uploadCatalogLogo } from "./upload-image";

function session(expiresAt: number): Session {
  return {
    access_token: "token",
    refresh_token: "refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expiresAt,
    user: { id: "user-123" },
  } as Session;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("uploadImage", () => {
  it("renova a sessão expirada antes de enviar a imagem", async () => {
    const expired = session(Math.floor(Date.now() / 1000) - 10);
    const renewed = session(Math.floor(Date.now() / 1000) + 3600);
    vi.spyOn(supabase.auth, "getSession")
      .mockResolvedValueOnce({ data: { session: expired }, error: null })
      .mockResolvedValueOnce({ data: { session: renewed }, error: null });
    const refresh = vi.spyOn(supabase.auth, "refreshSession").mockResolvedValue({
      data: { user: renewed.user, session: renewed },
      error: null,
    });
    const upload = vi.fn().mockResolvedValue({ data: { path: "logo.jpg" }, error: null });
    vi.spyOn(supabase.storage, "from").mockReturnValue({
      upload,
      getPublicUrl: () => ({ data: { publicUrl: "https://cdn.test/logo.jpg" } }),
    } as never);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]))),
    );

    await expect(uploadCatalogLogo("file:///logo.jpg")).resolves.toBe(
      "https://cdn.test/logo.jpg",
    );
    expect(refresh).toHaveBeenCalledOnce();
    expect(upload).toHaveBeenCalledOnce();
  });

  it("renova a sessão e repete uma vez quando o Storage responde 401", async () => {
    const active = session(Math.floor(Date.now() / 1000) + 3600);
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: { session: active },
      error: null,
    });
    const refresh = vi.spyOn(supabase.auth, "refreshSession").mockResolvedValue({
      data: { user: active.user, session: active },
      error: null,
    });
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { status: 401, statusCode: "401" } })
      .mockResolvedValueOnce({ data: { path: "logo.jpg" }, error: null });
    vi.spyOn(supabase.storage, "from").mockReturnValue({
      upload,
      getPublicUrl: () => ({ data: { publicUrl: "https://cdn.test/logo.jpg" } }),
    } as never);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]))),
    );

    await expect(uploadCatalogLogo("file:///logo.jpg")).resolves.toBe(
      "https://cdn.test/logo.jpg",
    );
    expect(refresh).toHaveBeenCalledOnce();
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it("usa o File preservado pelo seletor web sem reler a URL blob", async () => {
    const active = session(Math.floor(Date.now() / 1000) + 3600);
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: { session: active },
      error: null,
    });
    const upload = vi.fn().mockResolvedValue({ data: { path: "logo.png" }, error: null });
    vi.spyOn(supabase.storage, "from").mockReturnValue({
      upload,
      getPublicUrl: () => ({ data: { publicUrl: "https://cdn.test/logo.png" } }),
    } as never);
    const bytes = new ArrayBuffer(3);
    const selectedFile = {
      type: "image/png",
      arrayBuffer: vi.fn().mockResolvedValue(bytes),
    } as unknown as Blob;
    const fetchMock = vi.fn().mockRejectedValue(new Error("URL blob expirada"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      uploadCatalogLogo("blob:http://localhost/logo", selectedFile),
    ).resolves.toBe("https://cdn.test/logo.png");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-123\/catalog-logo-\d+\.png$/),
      bytes,
      { contentType: "image/png", upsert: false },
    );
  });
});

describe("supportedImageMimeFromBytes", () => {
  it("identifica os três formatos permitidos pelo cabeçalho real", () => {
    expect(
      supportedImageMimeFromBytes(
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer,
      ),
    ).toBe("image/png");
    expect(supportedImageMimeFromBytes(Uint8Array.from([0xff, 0xd8, 0xff]).buffer)).toBe(
      "image/jpeg",
    );
    expect(
      supportedImageMimeFromBytes(
        Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
          .buffer,
      ),
    ).toBe("image/webp");
  });

  it("rejeita conteúdo arbitrário disfarçado de imagem", () => {
    expect(
      supportedImageMimeFromBytes(new TextEncoder().encode("<script>").buffer),
    ).toBeNull();
  });
});
