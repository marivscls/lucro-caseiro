/**
 * Identificador da tentativa de criação. Não é segredo: só precisa manter o
 * mesmo valor entre reenvios e ter o formato UUID aceito pela API.
 */
export function createOrderRequestId(random: () => number = Math.random): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const value = Math.floor(random() * 16);
    const nibble = character === "x" ? value : (value & 0x3) | 0x8;
    return nibble.toString(16);
  });
}
