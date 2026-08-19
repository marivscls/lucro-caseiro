import { supabase } from "./supabase";

// Bucket público único para imagens do app (fotos de produto e logos de rótulo).
// Caminhos são escopados por usuário (`${userId}/...`) pelas policies do storage.
const BUCKET = "product-photos";
const SESSION_EXPIRY_MARGIN_MS = 60_000;

function sessionExpired(expiresAt?: number): boolean {
  return (
    typeof expiresAt === "number" &&
    expiresAt * 1000 <= Date.now() + SESSION_EXPIRY_MARGIN_MS
  );
}

async function ensureUploadSession(forceRefresh = false): Promise<void> {
  const result = forceRefresh
    ? await supabase.auth.refreshSession()
    : await supabase.auth.getSession();
  if (result.error || !result.data.session) {
    throw new Error("Sua sessão expirou. Entre novamente e tente salvar.");
  }
  if (!forceRefresh && sessionExpired(result.data.session.expires_at)) {
    await ensureUploadSession(true);
  }
}

function isUnauthorizedUpload(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { status?: number; statusCode?: string };
  return value.status === 401 || value.statusCode === "401";
}

/**
 * Sobe uma imagem local (file:// do image picker) pro Supabase Storage e
 * devolve a URL pública. Caminho: `${userId}/${prefix}{timestamp}.{ext}` — escopado por usuário.
 */
async function uploadImage(
  localUri: string,
  prefix: string,
  selectedFile?: Blob,
  selectedMimeType?: string,
  validateImageBytes = false,
): Promise<string> {
  await ensureUploadSession();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Sua sessão expirou. Entre novamente e tente salvar.");

  // Abordagem oficial do Supabase para React Native.
  let arraybuffer: ArrayBuffer;
  try {
    arraybuffer = selectedFile
      ? await selectedFile.arrayBuffer()
      : await fetch(localUri).then((res) => res.arrayBuffer());
  } catch {
    throw new Error(
      "Não foi possível ler a imagem escolhida. Selecione o arquivo novamente.",
    );
  }

  const rawExt = (localUri.split(".").pop() ?? "jpg").split("?")[0].toLowerCase();
  const selectedType = (selectedFile?.type || selectedMimeType)?.toLowerCase();
  const detectedType = validateImageBytes
    ? supportedImageMimeFromBytes(arraybuffer)
    : null;
  if (validateImageBytes && !detectedType) {
    throw new Error(
      "O arquivo escolhido não contém uma imagem PNG, JPEG ou WebP válida.",
    );
  }
  if (detectedType && selectedType && detectedType !== selectedType) {
    throw new Error("O conteúdo da imagem não corresponde ao formato informado.");
  }
  const contentMimeType = detectedType ?? selectedType;
  let extension = "jpg";
  if (contentMimeType === "image/png" || rawExt === "png") extension = "png";
  if (contentMimeType === "image/webp" || rawExt === "webp") extension = "webp";
  let contentType = "image/jpeg";
  if (extension === "png") contentType = "image/png";
  if (extension === "webp") contentType = "image/webp";
  const path = `${userId}/${prefix}${Date.now()}.${extension}`;

  const bucket = supabase.storage.from(BUCKET);
  let { error } = await bucket.upload(path, arraybuffer, { contentType, upsert: false });
  if (isUnauthorizedUpload(error)) {
    await ensureUploadSession(true);
    ({ error } = await bucket.upload(path, arraybuffer, { contentType, upsert: false }));
  }
  if (error) {
    throw new Error(
      "Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.",
    );
  }

  return bucket.getPublicUrl(path).data.publicUrl;
}

export function uploadProductImage(localUri: string): Promise<string> {
  return uploadImage(localUri, "");
}

export function uploadLabelLogo(localUri: string): Promise<string> {
  return uploadImage(localUri, "logo-");
}

export function uploadOrderImage(localUri: string): Promise<string> {
  return uploadImage(localUri, "order-");
}

export function uploadRecipeImage(localUri: string): Promise<string> {
  return uploadImage(localUri, "recipe-");
}

export function uploadCatalogCover(
  localUri: string,
  selectedFile?: Blob,
): Promise<string> {
  return uploadImage(localUri, "catalog-cover-", selectedFile);
}

export function uploadCatalogLogo(
  localUri: string,
  selectedFile?: Blob,
): Promise<string> {
  return uploadImage(localUri, "catalog-logo-", selectedFile);
}

export function uploadProfilePhoto(localUri: string): Promise<string> {
  return uploadImage(localUri, "profile-");
}

export function uploadSupplierImage(
  localUri: string,
  selectedFile?: Blob,
  selectedMimeType?: string,
): Promise<string> {
  return uploadImage(localUri, "supplier-", selectedFile, selectedMimeType, true);
}

export function supportedImageMimeFromBytes(
  buffer: ArrayBuffer,
): "image/jpeg" | "image/png" | "image/webp" | null {
  const bytes = new Uint8Array(buffer);
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}
