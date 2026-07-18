interface ExportHtmlOptions {
  dialogTitle: string;
  filename?: string;
}

export async function exportHtmlPdf(
  html: string,
  { dialogTitle, filename }: ExportHtmlOptions,
): Promise<void> {
  const [Print, Sharing] = await Promise.all([
    import("expo-print"),
    import("expo-sharing"),
  ]);
  const { uri } = await Print.printToFileAsync({ html });
  let shareUri = uri;

  if (filename) {
    try {
      const { File, Paths } = await import("expo-file-system");
      const destination = new File(Paths.cache, filename);
      if (destination.exists) destination.delete();
      new File(uri).copy(destination);
      shareUri = destination.uri;
    } catch {
      shareUri = uri;
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, {
      mimeType: "application/pdf",
      dialogTitle,
      UTI: "com.adobe.pdf",
    });
    return;
  }

  await Print.printAsync({ html });
}
