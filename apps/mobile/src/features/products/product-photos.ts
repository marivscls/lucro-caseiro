/** Resolve all selected photos before submitting a product. Never return a partial gallery. */
export async function prepareProductPhotos(
  selected: string | null | undefined,
  extraUris: readonly string[],
  fallback: string | undefined,
  upload: (uri: string) => Promise<string>,
): Promise<{ photoUrl: string | undefined; extraPhotos: string[] | undefined }> {
  const resolve = (uri: string) =>
    /^https?:\/\//i.test(uri) ? Promise.resolve(uri) : upload(uri);
  const photoUrl = selected ? await resolve(selected) : fallback;
  const extraPhotos: string[] = [];
  for (const uri of extraUris) extraPhotos.push(await resolve(uri));
  return { photoUrl, extraPhotos: extraPhotos.length ? extraPhotos : undefined };
}
