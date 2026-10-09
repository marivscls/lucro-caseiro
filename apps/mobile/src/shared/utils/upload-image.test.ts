import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { supabase } from "./supabase";
import {
  supportedImageMimeFromBytes,
  uploadCatalogLogo,
  uploadProductImage,
  uploadRecipeImage,
  uploadProfilePhoto,
  uploadOrderImage,
  uploadLabelLogo,
  uploadCatalogCover,
  uploadSupplierImage,
  uploadErrorMessage,
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
      vi.fn().mockResolvedValue(new Response(new Uint8Array([0xff, 0xd8, 0xff]))),
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
      vi.fn().mockResolvedValue(new Response(new Uint8Array([0xff, 0xd8, 0xff]))),
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
    const bytes = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]).buffer;
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
      expect.stringMatching(/^user-123\/catalog-logo-\d+-\d+-[a-z0-9]+\.png$/),
      bytes,
      { contentType: "image/png", upsert: false },
    );
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

it("uses actual selected MIME over stale URI extension after conversion", async () => {
  const active = session(Math.floor(Date.now() / 1000) + 3600);
  vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
    data: { session: active },
    error: null,
  });
  const upload = vi
    .fn()
    .mockResolvedValue({ data: { path: "converted.jpg" }, error: null });
  vi.spyOn(supabase.storage, "from").mockReturnValue({
    upload,
    getPublicUrl: () => ({ data: { publicUrl: "https://cdn.test/converted.jpg" } }),
  } as never);
  await uploadCatalogLogo(
    "file:///original.png",
    new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }),
  );
  expect(upload).toHaveBeenCalledWith(
    expect.stringMatching(/\.jpg$/),
    expect.any(ArrayBuffer),
    { contentType: "image/jpeg", upsert: false },
  );
});

function setupPngUpload() {
  const active = session(Math.floor(Date.now() / 1000) + 3600);
  vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
    data: { session: active },
    error: null,
  });
  const upload = vi.fn().mockResolvedValue({ data: { path: "photo.png" }, error: null });
  vi.spyOn(supabase.storage, "from").mockReturnValue({
    upload,
    getPublicUrl: () => ({ data: { publicUrl: "https://cdn.test/photo.png" } }),
  } as never);
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          new Response(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
        ),
      ),
  );
  return upload;
}
it.each([
  { name: "product", send: uploadProductImage },
  { name: "recipe", send: uploadRecipeImage },
  { name: "profile", send: uploadProfilePhoto },
  { name: "order", send: uploadOrderImage },
  { name: "label", send: uploadLabelLogo },
  { name: "cover", send: uploadCatalogCover },
  { name: "logo", send: uploadCatalogLogo },
  { name: "supplier", send: uploadSupplierImage },
])(
  "identifies actual native PNG bytes without URI extension for $name",
  async ({ send }) => {
    const upload = setupPngUpload();
    await expect(send("file:///native-selected-photo")).resolves.toBe(
      "https://cdn.test/photo.png",
    );
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-123\/.*\.png$/),
      expect.any(ArrayBuffer),
      { contentType: "image/png", upsert: false },
    );
  },
);
it("does not collide when two catalog photos upload in the same millisecond", async () => {
  const upload = setupPngUpload();
  vi.spyOn(Date, "now").mockReturnValue(1770000000000);
  vi.spyOn(performance, "now").mockReturnValue(1);
  await Promise.all([
    uploadCatalogCover("file:///one"),
    uploadCatalogCover("file:///two"),
  ]);
  expect(upload).toHaveBeenCalledTimes(2);
  expect(upload.mock.calls[0]?.[0]).not.toBe(upload.mock.calls[1]?.[0]);
});
it("rejects HTML/unsupported bytes before sending a fake JPEG to Storage", async () => {
  const upload = setupPngUpload();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("<html>missing file</html>")),
  );
  await expect(uploadProfilePhoto("file:///missing.jpg")).rejects.toThrow(
    "PNG, JPEG ou WebP",
  );
  expect(upload).not.toHaveBeenCalled();
});
it("reports a Storage permission error without returning a durable URL", async () => {
  const upload = setupPngUpload();
  upload.mockResolvedValue({
    data: null,
    error: { status: 403, message: "new row violates row-level security policy" },
  });
  await expect(uploadRecipeImage("file:///selected")).rejects.toThrow("permissão");
});
