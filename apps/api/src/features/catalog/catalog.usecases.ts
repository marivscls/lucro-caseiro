import type {
  CatalogSettings,
  PublicCatalog,
  UpdateCatalogSettings,
} from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { isValidSlug, slugify } from "./catalog.domain";
import type { ICatalogRepo } from "./catalog.types";

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

    return this.repo.upsert(userId, {
      slug,
      enabled: data.enabled ?? current.enabled,
      whatsapp: data.whatsapp === undefined ? current.whatsapp : data.whatsapp,
    });
  }

  /** Catalogo publico por slug. 404 se nao existir ou estiver desativado. */
  async getPublicCatalog(slug: string): Promise<PublicCatalog> {
    const owner = await this.repo.findOwnerBySlug(slug);
    if (!owner || !owner.enabled) {
      throw new NotFoundError("Catálogo não encontrado");
    }

    const products = await this.repo.listPublicProducts(owner.userId);
    return {
      businessName: owner.businessName,
      whatsapp: owner.whatsapp ?? owner.phone,
      products,
    };
  }
}
