interface ExportHtmlOptions {
  dialogTitle: string;
  filename?: string;
}

export async function exportHtmlPdf(
  html: string,
  _options: ExportHtmlOptions,
): Promise<void> {
  const documentUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const printWindow = window.open(documentUrl, "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(documentUrl);
    throw new Error("O navegador bloqueou a janela de impressão.");
  }

  printWindow.opener = null;
  await new Promise<void>((resolve) => {
    printWindow.addEventListener("load", () => resolve(), { once: true });
    window.setTimeout(resolve, 1_000);
  });

  printWindow.focus();
  printWindow.print();
  window.setTimeout(() => URL.revokeObjectURL(documentUrl), 60_000);
}
