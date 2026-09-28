import { isMockMode } from "../mock/mode";

// Modo demonstração: sem rede, então o HTML exportado usa a fonte de reserva.
export const MANROPE_HTML_HEAD = isMockMode
  ? ""
  : '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet" />';

export const MANROPE_CSS_FONT_FAMILY = '"Manrope", Arial, sans-serif';
