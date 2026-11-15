interface ExportHtmlOptions {
  dialogTitle: string;
  filename?: string;
}

const CLEANUP_FALLBACK_MS = 5 * 60_000;

/**
 * Imprime o documento num iframe escondido da própria página. Não abre janela
 * nova: bloqueador de pop-up, app instalado (PWA) e navegador embutido
 * devolviam `null` no `window.open` e o PDF falhava.
 */
export async function exportHtmlPdf(
  html: string,
  _options: ExportHtmlOptions,
): Promise<void> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  Object.assign(frame.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  const loaded = new Promise<void>((resolve) => {
    frame.addEventListener("load", () => resolve(), { once: true });
  });
  frame.srcdoc = html;
  document.body.appendChild(frame);
  await loaded;

  const printWindow = frame.contentWindow;
  if (!printWindow) {
    frame.remove();
    throw new Error("O navegador não conseguiu preparar o documento.");
  }

  let removed = false;
  const cleanup = () => {
    if (removed) return;
    removed = true;
    frame.remove();
  };
  printWindow.addEventListener("afterprint", () => window.setTimeout(cleanup, 0), {
    once: true,
  });
  window.setTimeout(cleanup, CLEANUP_FALLBACK_MS);

  printWindow.focus();
  printWindow.print();
}
