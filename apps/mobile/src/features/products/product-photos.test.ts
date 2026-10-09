import { expect, it, vi } from "vitest";
import { prepareProductPhotos } from "./product-photos";
it("retains existing public photos without uploading again", async () => {
  const upload = vi.fn();
  expect(
    await prepareProductPhotos(
      "https://cdn.test/main.jpg",
      ["https://cdn.test/extra.jpg"],
      undefined,
      upload,
    ),
  ).toEqual({
    photoUrl: "https://cdn.test/main.jpg",
    extraPhotos: ["https://cdn.test/extra.jpg"],
  });
  expect(upload).not.toHaveBeenCalled();
});
it("preserves selection order and uses uploaded durable URLs instead of local URIs", async () => {
  const upload = vi.fn((uri: string) =>
    Promise.resolve("https://cdn.test/" + uri.slice(7)),
  );
  const result = await prepareProductPhotos(
    "file://main.jpg",
    ["file://a.jpg", "file://b.jpg"],
    undefined,
    upload,
  );
  expect(result).toEqual({
    photoUrl: "https://cdn.test/main.jpg",
    extraPhotos: ["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"],
  });
});
it("blocks product submission when primary upload fails and permits a retry", async () => {
  const save = vi.fn(),
    upload = vi
      .fn()
      .mockRejectedValueOnce(Error("Storage denied"))
      .mockResolvedValue("https://cdn.test/main.jpg");
  const submit = async () =>
    save(await prepareProductPhotos("blob:chosen", [], undefined, upload));
  await expect(submit()).rejects.toThrow("Storage denied");
  expect(save).not.toHaveBeenCalled();
  await submit();
  expect(save).toHaveBeenCalledWith({
    photoUrl: "https://cdn.test/main.jpg",
    extraPhotos: undefined,
  });
});
it("never submits a silently truncated gallery when an extra photo fails", async () => {
  const upload = vi
      .fn()
      .mockResolvedValueOnce("https://cdn.test/main.jpg")
      .mockResolvedValueOnce("https://cdn.test/a.jpg")
      .mockRejectedValueOnce(Error("network")),
    save = vi.fn();
  const submit = async () =>
    save(
      await prepareProductPhotos(
        "file://main.jpg",
        ["file://a.jpg", "file://b.jpg"],
        undefined,
        upload,
      ),
    );
  await expect(submit()).rejects.toThrow("network");
  expect(save).not.toHaveBeenCalled();
});
it("keeps fallback only when no replacement was selected", async () => {
  const upload = vi.fn();
  expect(
    await prepareProductPhotos(null, [], "https://cdn.test/original.jpg", upload),
  ).toMatchObject({ photoUrl: "https://cdn.test/original.jpg" });
});
