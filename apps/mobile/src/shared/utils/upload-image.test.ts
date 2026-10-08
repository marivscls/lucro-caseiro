import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { supabase } from "./supabase";

const fileArrayBuffer = vi.hoisted(() => vi.fn());
vi.mock("expo-file-system", () => ({
  File: class {
    constructor(readonly uri: string) {}
    arrayBuffer() {
      return fileArrayBuffer(this.uri);
    }
  },
}));
import {
  supportedImageMimeFromBytes,
  uploadCatalogLogo,
  uploadErrorMessage,
  uploadProductImage,
} from "./upload-image";

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

beforeEach(() => {
  vi.spyOn(supabase.auth, "getSession").mockReset();
  vi.spyOn(supabase.auth, "refreshSession").mockReset();
  vi.spyOn(supabase.storage, "from").mockReset();
  fileArrayBuffer.mockReset().mockRejectedValue(new Error("sem FileSystem"));
});

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

describe("uploadImage no app nativo", () => {
  it("lê a foto do picker direto do disco, sem passar pelo fetch", async () => {
    const active = session(Math.floor(Date.now() / 1000) + 3600);
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: { session: active },
      error: null,
    });
    const upload = vi.fn().mockResolvedValue({ data: { path: "p.jpg" }, error: null });
    vi.spyOn(supabase.storage, "from").mockReturnValue({
      upload,
      getPublicUrl: () => ({ data: { publicUrl: "https://cdn.test/p.jpg" } }),
    } as never);
    const bytes = Uint8Array.from([0xff, 0xd8, 0xff]).buffer;
    fileArrayBuffer.mockResolvedValue(bytes);
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network request failed"));
    vi.stubGlobal("fetch", fetchMock);
    const uri = "file:///data/user/0/app/cache/ImagePicker/foto.jpeg";

    await expect(uploadProductImage(uri)).resolves.toBe("https://cdn.test/p.jpg");
    expect(fileArrayBuffer).toHaveBeenCalledWith(uri);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-123\/\d+\.jpg$/),
      bytes,
      { contentType: "image/jpeg", upsert: false },
    );
  });

  it("não envia arquivo vazio e avisa para escolher a foto de novo", async () => {
    const active = session(Math.floor(Date.now() / 1000) + 3600);
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: { session: active },
      error: null,
    });
    const upload = vi.fn();
    vi.spyOn(supabase.storage, "from").mockReturnValue({ upload } as never);
    fileArrayBuffer.mockResolvedValue(new ArrayBuffer(0));

    await expect(uploadProductImage("file:///vazia.jpg")).rejects.toThrow(
      /Selecione o arquivo novamente/,
    );
    expect(upload).not.toHaveBeenCalled();
  });
});

describe("uploadErrorMessage", () => {
  it("diz o motivo real da recusa do Storage", () => {
    expect(
      uploadErrorMessage({ message: "Bucket not found", statusCode: "404" }),
    ).toMatch(/bucket product-photos/);
    expect(
      uploadErrorMessage({
        message: "The object exceeded the maximum allowed size",
        statusCode: "413",
      }),
    ).toMatch(/grande demais/);
    expect(
      uploadErrorMessage({ message: "new row violates row-level security policy" }),
    ).toMatch(/permissão/);
    expect(
      uploadErrorMessage({ message: "mime type image/heic is not supported" }),
    ).toMatch(/formato/);
    expect(uploadErrorMessage({ message: "algo inesperado" })).toBe(
      "Não foi possível enviar a imagem (algo inesperado).",
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
