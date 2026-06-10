import { supabase } from "./supabase";

// Bucket público único para imagens do app (fotos de produto e logos de rótulo).
// Caminhos são escopados por usuário (`${userId}/...`) pelas policies do storage.
const BUCKET = "product-photos";

/**
 * Sobe uma imagem local (file:// do image picker) pro Supabase Storage e
 * devolve a URL pública. Caminho: `${userId}/${prefix}{timestamp}.{ext}` — escopado por usuário.
 */
async function uploadImage(localUri: string, prefix: string): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Sessão expirada. Entre novamente.");

  // Abordagem oficial do Supabase para React Native.
  const arraybuffer = await fetch(localUri).then((res) => res.arrayBuffer());

  const rawExt = (localUri.split(".").pop() ?? "jpg").split("?")[0].toLowerCase();
  const isPng = rawExt === "png";
  const contentType = isPng ? "image/png" : "image/jpeg";
  const path = `${userId}/${prefix}${Date.now()}.${isPng ? "png" : "jpg"}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arraybuffer, { contentType, upsert: false });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
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

export function uploadCatalogCover(localUri: string): Promise<string> {
  return uploadImage(localUri, "catalog-cover-");
}
