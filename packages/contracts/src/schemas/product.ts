import { z } from "zod";
import { MAX_MONEY, MAX_QUANTITY } from "./common";

/** Unidade de venda: por unidade ou por quilo (R$/kg). */
export const SaleUnit = z.enum(["unit", "kg"]);
export type SaleUnit = z.infer<typeof SaleUnit>;

/** Componente de um produto composto (kit/caixinha): produto-filho + quantidade. */
export const ProductComponentInputDto = z.object({
  componentProductId: z.string().uuid(),
  quantity: z.number().positive().max(MAX_QUANTITY),
});

export type ProductComponentInput = z.infer<typeof ProductComponentInputDto>;

export const ProductVariationInputDto = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  color: z.string().max(60).optional(),
  size: z.string().max(60).optional(),
  stockQuantity: z.number().int().min(0).max(MAX_QUANTITY).optional(),
});

export type ProductVariationInput = z.infer<typeof ProductVariationInputDto>;

export const ProductVariationDto = ProductVariationInputDto.extend({
  id: z.string().uuid(),
});

export type ProductVariation = z.infer<typeof ProductVariationDto>;

export const ReplaceProductVariationsDto = z.object({
  variations: z.array(ProductVariationInputDto).max(100),
});

const ProductBaseDto = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  photoUrl: z.string().url().optional(),
  // Fotos adicionais (galeria) além da principal. Máx 2 (total 3); só Premium.
  extraPhotos: z.array(z.string().url()).max(2).optional(),
  // Código/SKU/código de barras (opcional) para buscar/escanear o produto.
  code: z.string().max(100).optional(),
  salePrice: z.number().positive().max(MAX_MONEY),
  costPrice: z.number().min(0).max(MAX_MONEY).optional(),
  saleUnit: SaleUnit.optional(),
  recipeId: z.string().uuid().optional(),
  stockQuantity: z.number().int().min(0).max(MAX_QUANTITY).optional(),
  stockAlertThreshold: z.number().int().min(0).max(MAX_QUANTITY).optional(),
  // Produto composto (kit): quando true, `components` e obrigatorio e nao-vazio.
  isComposite: z.boolean().optional(),
  components: z.array(ProductComponentInputDto).optional(),
  variations: z.array(ProductVariationInputDto).max(100).optional(),
});

/** Um produto composto precisa de pelo menos um componente. */
function compositeHasComponents(data: {
  isComposite?: boolean;
  components?: ProductComponentInput[];
}): boolean {
  return !data.isComposite || (data.components?.length ?? 0) > 0;
}

const compositeRefine = {
  message: "Um produto composto precisa de pelo menos um componente",
  path: ["components"],
};

export const CreateProductDto = ProductBaseDto.refine(
  compositeHasComponents,
  compositeRefine,
);

export type CreateProduct = z.infer<typeof CreateProductDto>;

export const UpdateProductDto = ProductBaseDto.partial().refine(
  compositeHasComponents,
  compositeRefine,
);
export type UpdateProduct = z.infer<typeof UpdateProductDto>;

/** Componente resolvido para exibicao (nome + custo + quantidade). */
export const ProductComponentDto = z.object({
  componentProductId: z.string().uuid(),
  name: z.string(),
  costPrice: z.number().nullable(),
  quantity: z.number(),
});

export type ProductComponent = z.infer<typeof ProductComponentDto>;

export const ProductDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  photoUrl: z.string().nullable(),
  extraPhotos: z.array(z.string()),
  code: z.string().nullable(),
  salePrice: z.number(),
  saleUnit: SaleUnit,
  costPrice: z.number().nullable(),
  recipeId: z.string().uuid().nullable(),
  stockQuantity: z.number().int().nullable(),
  stockAlertThreshold: z.number().int().nullable(),
  isComposite: z.boolean(),
  // Presente apenas quando isComposite = true.
  components: z.array(ProductComponentDto).optional(),
  variations: z.array(ProductVariationDto).optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductDto>;

export const ProductLookupSuggestionDto = z.object({
  code: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
  brand: z.string().nullable(),
  source: z.literal("cosmos"),
});

export type ProductLookupSuggestion = z.infer<typeof ProductLookupSuggestionDto>;

export const ProductCodeLookupDto = z.discriminatedUnion("status", [
  z.object({ status: z.literal("found"), product: ProductDto }),
  z.object({ status: z.literal("suggestion"), suggestion: ProductLookupSuggestionDto }),
  z.object({ status: z.literal("not_found") }),
]);

export type ProductCodeLookup = z.infer<typeof ProductCodeLookupDto>;
