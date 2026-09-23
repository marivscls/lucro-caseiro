import { describe, expect, it, vi } from "vitest";

import { getInstallationAcquisition } from "./acquisition";
import { parseAcquisition } from "./acquisition-parse";
import type { InstallationStorage } from "./installation";

function memoryStorage(initial: string | null = null) {
  let value = initial;
  const setItem = vi.fn((_key: string, next: string) => {
    value = next;
    return Promise.resolve();
  });
  const storage: InstallationStorage = {
    getItem: vi.fn(() => Promise.resolve(value)),
    setItem,
  };
  return { storage, setItem };
}

describe("parseAcquisition", () => {
  it("lê UTM da URL do PWA e só o host de quem trouxe a pessoa", () => {
    // Arrange
    const query =
      "?utm_source=site_publico&utm_medium=owned&utm_campaign=landing&utm_content=pwa_header&x=1";

    // Act
    const result = parseAcquisition(
      query,
      "https://www.google.com/search?q=segredo",
      "app.lucrocaseiro.com.br",
    );

    // Assert
    expect(result).toEqual({
      utmSource: "site_publico",
      utmMedium: "owned",
      utmCampaign: "landing",
      utmContent: "pwa_header",
      referrer: "www.google.com",
    });
  });

  it("aceita o formato do Install Referrer da Play", () => {
    // Arrange
    const referrer = "utm_source=site_publico&utm_content=hero_primary";

    // Act
    const result = parseAcquisition(referrer);

    // Assert
    expect(result).toEqual({ utmSource: "site_publico", utmContent: "hero_primary" });
  });

  it("ignora navegação interna, valores vazios e corta valores longos", () => {
    // Arrange
    const query = `?utm_source=${"a".repeat(150)}&utm_medium=%20%20`;

    // Act
    const result = parseAcquisition(
      query,
      "https://app.exemplo.com/login",
      "app.exemplo.com",
    );

    // Assert
    expect(result).toEqual({ utmSource: "a".repeat(100) });
    expect(parseAcquisition("", "nao e url", null)).toBeNull();
  });
});

describe("getInstallationAcquisition", () => {
  it("captura na primeira abertura e reutiliza depois, sem ler a origem de novo", async () => {
    // Arrange
    const { storage, setItem } = memoryStorage();
    const read = vi.fn(() => Promise.resolve({ utmSource: "site_publico" }));

    // Act
    const first = await getInstallationAcquisition(storage, read);
    const second = await getInstallationAcquisition(storage, read);

    // Assert
    expect(first).toEqual({ utmSource: "site_publico" });
    expect(second).toEqual({ utmSource: "site_publico" });
    expect(read).toHaveBeenCalledOnce();
    expect(setItem).toHaveBeenCalledOnce();
  });

  it("memoriza a ausência de origem para não adotar UTM de aberturas futuras", async () => {
    // Arrange
    const { storage } = memoryStorage();
    const later = vi.fn(() => Promise.resolve({ utmSource: "campanha_posterior" }));

    // Act
    await getInstallationAcquisition(storage, () => Promise.resolve(null));
    const result = await getInstallationAcquisition(storage, later);

    // Assert
    expect(result).toBeUndefined();
    expect(later).not.toHaveBeenCalled();
  });

  it("não falha a abertura quando a leitura da origem quebra", async () => {
    // Arrange
    const { storage } = memoryStorage();

    // Act
    const result = await getInstallationAcquisition(storage, () =>
      Promise.reject(new Error("sem módulo nativo")),
    );

    // Assert
    expect(result).toBeUndefined();
  });
});
