import type {
  CatalogSettings,
  PublicCatalog,
  UpdateCatalogSettings,
} from "@lucro-caseiro/contracts";

import { LimitExceededError, NotFoundError, ValidationError } from "../../shared/errors";
import { isValidSlug, slugify } from "./catalog.domain";
import type { ICatalogRepo } from "./catalog.types";

function wantsCustomization(data: UpdateCatalogSettings): boolean {
  return (
    data.coverUrl !== undefined ||
    data.logoUrl !== undefined ||
    data.accentColor !== undefined ||
    data.pattern !== undefined ||
    data.tagline !== undefined
  );
}

export class CatalogUseCases {
  constructor(private repo: ICatalogRepo) {}

  /** Retorna as configuracoes do catalogo, criando defaults na primeira vez. */
  async getSettings(userId: string): Promise<CatalogSettings> {
    const existing = await this.repo.findByUser(userId);
    if (existing) return existing;

    const owner = await this.repo.getOwnerDefaults(userId);
    if (!owner) throw new NotFoundError("Usuário não encontrado");

    const base = slugify(owner.businessName || "meu-catalogo");
    let slug = base;
    let attempt = 1;
    while (await this.repo.slugTaken(slug, userId)) {
      attempt += 1;
      slug = `${base.slice(0, 36)}-${attempt}`;
    }

    return this.repo.upsert(userId, {
      slug,
      enabled: false,
      whatsapp: owner.phone,
      coverUrl: null,
      logoUrl: null,
      accentColor: null,
      pattern: null,
      tagline: null,
    });
  }

  async updateSettings(
    userId: string,
    data: UpdateCatalogSettings,
  ): Promise<CatalogSettings> {
    const current = await this.getSettings(userId);
    const slug = data.slug ?? current.slug;

    if (!isValidSlug(slug)) {
      throw new ValidationError([
        "Endereço inválido. Use apenas letras minúsculas, números e hífens.",
      ]);
    }
    if (slug !== current.slug && (await this.repo.slugTaken(slug, userId))) {
      throw new ValidationError(["Este endereço já está em uso. Escolha outro."]);
    }

    // Personalizacao (capa/cor/frase) e exclusiva do plano Premium.
    if (wantsCustomization(data)) {
      const owner = await this.repo.getOwnerDefaults(userId);
      if (owner?.plan !== "premium") {
        throw new LimitExceededError(
          "A personalização do catálogo é exclusiva do plano Premium.",
        );
      }
    }

    return this.repo.upsert(userId, {
      slug,
      enabled: data.enabled ?? current.enabled,
      whatsapp: data.whatsapp === undefined ? current.whatsapp : data.whatsapp,
      coverUrl: data.coverUrl === undefined ? current.coverUrl : data.coverUrl,
      logoUrl: data.logoUrl === undefined ? current.logoUrl : data.logoUrl,
      accentColor:
        data.accentColor === undefined ? current.accentColor : data.accentColor,
      pattern: data.pattern === undefined ? current.pattern : data.pattern,
      tagline: data.tagline === undefined ? current.tagline : data.tagline,
    });
  }

  /** Catalogo publico por slug. 404 se nao existir ou estiver desativado. */
  async getPublicCatalog(slug: string): Promise<PublicCatalog> {
    const owner = await this.repo.findOwnerBySlug(slug);
    if (!owner || !owner.enabled) {
      throw new NotFoundError("Catálogo não encontrado");
    }

    const products = await this.repo.listPublicProducts(owner.userId);
    // Personalizacao so aparece enquanto o dono for Premium (se a assinatura
    // cair, a pagina volta ao tema padrao sem apagar o que foi salvo).
    const isPremium = owner.plan === "premium";
    return {
      businessName: owner.businessName,
      whatsapp: owner.whatsapp ?? owner.phone,
      coverUrl: isPremium ? owner.coverUrl : null,
      logoUrl: isPremium ? owner.logoUrl : null,
      accentColor: isPremium ? owner.accentColor : null,
      pattern: isPremium ? owner.pattern : null,
      tagline: isPremium ? owner.tagline : null,
      products,
    };
  }
}
