import type {
  CatalogSettings,
  PublicCatalog,
  PublicServiceBookingRequestInput,
  ServiceBookingRequest,
  UpdateCatalogSettings,
} from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { DEFAULT_BRAND_ID } from "@lucro-caseiro/brands";

import { LimitExceededError, NotFoundError, ValidationError } from "../../shared/errors";
import { isValidSlug, slugify } from "./catalog.domain";
import type { ICatalogRepo } from "./catalog.types";

function wantsCustomization(data: UpdateCatalogSettings): boolean {
  return (
    data.coverUrl !== undefined ||
    data.logoUrl !== undefined ||
    data.accentColor !== undefined ||
    data.pattern !== undefined ||
    data.tagline !== undefined ||
    data.promoBanner !== undefined ||
    data.serviceCoverUrl !== undefined ||
    data.serviceTagline !== undefined ||
    data.servicePromoBanner !== undefined
  );
}

export class CatalogUseCases {
  constructor(
    private repo: ICatalogRepo,
    private notifyServiceBooking?: (
      userId: string,
      brandId: string,
      serviceId: string,
      serviceName: string,
      bookingRequestId: string,
    ) => Promise<void>,
  ) {}

  /** Retorna as configuracoes do catalogo, criando defaults na primeira vez. */
  async getSettings(
    userId: string,
    brandId = DEFAULT_BRAND_ID,
  ): Promise<CatalogSettings> {
    const existing = await this.repo.findByUser(userId);
    if (existing) {
      if (existing.brandId === brandId) return existing;
      return this.repo.upsert(userId, { ...existing, brandId });
    }

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
      brandId,
      slug,
      enabled: false,
      whatsapp: owner.phone,
      coverUrl: null,
      logoUrl: null,
      accentColor: null,
      pattern: null,
      tagline: null,
      promoBanner: null,
      serviceCoverUrl: null,
      serviceTagline: null,
      servicePromoBanner: null,
    });
  }

  async updateSettings(
    userId: string,
    data: UpdateCatalogSettings,
    brandId = DEFAULT_BRAND_ID,
  ): Promise<CatalogSettings> {
    const current = await this.getSettings(userId, brandId);
    const slug = data.slug ?? current.slug;

    if (!isValidSlug(slug)) {
      throw new ValidationError([
        "Endereço inválido. Use apenas letras minúsculas, números e hífens.",
      ]);
    }
    if (slug !== current.slug && (await this.repo.slugTaken(slug, userId))) {
      throw new ValidationError(["Este endereço já está em uso. Escolha outro."]);
    }

    // Personalização (capa/cor/frase) está disponível a partir do Essencial.
    if (wantsCustomization(data)) {
      const owner = await this.repo.getOwnerDefaults(userId);
      if (
        !owner ||
        !hasActiveFeature(owner.plan, owner.planExpiresAt, "catalogCustomization")
      ) {
        throw new LimitExceededError(
          "A personalização do catálogo faz parte do plano Essencial.",
        );
      }
    }

    return this.repo.upsert(userId, {
      brandId,
      slug,
      enabled: data.enabled ?? current.enabled,
      whatsapp: data.whatsapp === undefined ? current.whatsapp : data.whatsapp,
      coverUrl: data.coverUrl === undefined ? current.coverUrl : data.coverUrl,
      logoUrl: data.logoUrl === undefined ? current.logoUrl : data.logoUrl,
      accentColor:
        data.accentColor === undefined ? current.accentColor : data.accentColor,
      pattern: data.pattern === undefined ? current.pattern : data.pattern,
      tagline: data.tagline === undefined ? current.tagline : data.tagline,
      promoBanner:
        data.promoBanner === undefined ? current.promoBanner : data.promoBanner,
      serviceCoverUrl:
        data.serviceCoverUrl === undefined
          ? current.serviceCoverUrl
          : data.serviceCoverUrl,
      serviceTagline:
        data.serviceTagline === undefined ? current.serviceTagline : data.serviceTagline,
      servicePromoBanner:
        data.servicePromoBanner === undefined
          ? current.servicePromoBanner
          : data.servicePromoBanner,
    });
  }

  /** Catalogo publico por slug. 404 se nao existir ou estiver desativado. */
  async getPublicCatalog(
    slug: string,
    focusedProductId?: string,
  ): Promise<PublicCatalog> {
    const owner = await this.repo.findOwnerBySlug(slug);
    if (!owner || !owner.enabled) {
      throw new NotFoundError("Catálogo não encontrado");
    }

    const [allProducts, services] = await Promise.all([
      this.repo.listPublicProducts(owner.userId),
      this.repo.listPublicServices?.(owner.userId) ?? Promise.resolve([]),
    ]);
    // Catálogo completo + personalização aparecem a partir do Essencial (se a
    // assinatura cair, a pagina volta ao tema padrao sem apagar o que foi salvo).
    const hasFullCatalog = hasActiveFeature(
      owner.plan,
      owner.planExpiresAt,
      "catalogPremium",
    );
    // O plano gratuito exibe no máximo 3 produtos na vitrine
    // (gatilho de conversao; o app mostra "Mostre seu catalogo completo").
    let products = allProducts;
    if (!hasFullCatalog) {
      products = allProducts.slice(0, 3);
      const focusedProduct = focusedProductId
        ? allProducts.find((product) => product.id === focusedProductId)
        : undefined;
      if (
        focusedProduct &&
        !products.some((product) => product.id === focusedProduct.id)
      ) {
        products = [focusedProduct, ...products].slice(0, 3);
      }
    }
    return {
      brandId: owner.brandId,
      businessName: owner.businessName,
      whatsapp: owner.whatsapp ?? owner.phone,
      coverUrl: hasFullCatalog ? owner.coverUrl : null,
      logoUrl: hasFullCatalog ? owner.logoUrl : null,
      accentColor: hasFullCatalog ? owner.accentColor : null,
      pattern: hasFullCatalog ? owner.pattern : null,
      tagline: hasFullCatalog ? owner.tagline : null,
      promoBanner: hasFullCatalog ? owner.promoBanner : null,
      serviceCoverUrl: hasFullCatalog ? owner.serviceCoverUrl : null,
      serviceTagline: hasFullCatalog ? owner.serviceTagline : null,
      servicePromoBanner: hasFullCatalog ? owner.servicePromoBanner : null,
      products,
      services,
      totalProducts: allProducts.length,
    };
  }

  async createPublicServiceBooking(
    slug: string,
    data: PublicServiceBookingRequestInput,
  ): Promise<ServiceBookingRequest> {
    const owner = await this.repo.findOwnerBySlug(slug);
    if (!owner || !owner.enabled || !this.repo.createPublicServiceBooking) {
      throw new NotFoundError("Catálogo não encontrado");
    }
    const created = await this.repo.createPublicServiceBooking(owner.userId, data);
    if (!created) throw new NotFoundError("Serviço não encontrado");
    if (this.notifyServiceBooking) {
      try {
        await this.notifyServiceBooking(
          owner.userId,
          owner.brandId,
          created.serviceId,
          created.serviceName,
          created.id,
        );
      } catch (error) {
        console.warn("Service booking push notification failed", error);
      }
    }
    return created;
  }

  async resolvePublicRetailOwner(
    slug: string,
  ): Promise<{ userId: string; brandId: string }> {
    const owner = await this.repo.findOwnerBySlug(slug);
    if (!owner || !owner.enabled || owner.brandId !== "lucro-papelaria") {
      throw new NotFoundError("Catálogo não encontrado");
    }
    return { userId: owner.userId, brandId: owner.brandId };
  }
}
