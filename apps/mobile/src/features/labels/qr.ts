import qrcode from "qrcode-generator";

/**
 * Gera o SVG de um QR code (JS puro, offline) a partir de um texto/link.
 * Módulos pretos sobre fundo branco (máximo contraste -> leitura confiável em
 * qualquer leitor, independente do template). Quiet zone de 2 módulos.
 * O mesmo SVG serve para o preview (react-native-svg) e para o PDF (HTML inline).
 */
export function buildQrSvg(text: string, color = "#000000"): string {
  const qr = qrcode(0, "M"); // type automático, correção de erro média
  qr.addData(text);
  qr.make();

  const count = qr.getModuleCount();
  const margin = 2;
  const size = count + margin * 2;

  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        path += `M${col + margin} ${row + margin}h1v1h-1z`;
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
    `shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="#ffffff"/>` +
    `<path d="${path}" fill="${color}"/></svg>`
  );
}
