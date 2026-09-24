/**
 * Depoimentos da landing. Só entram aqui falas de clientes reais, com
 * autorização por escrito para publicar nome, cidade e @ (guarde o print).
 * Enquanto a lista estiver vazia, a seção não aparece no site.
 */
export type Testimonial = {
  readonly quote: string;
  readonly name: string;
  /** O que a pessoa vende, em poucas palavras ("Bolos e doces"). */
  readonly business: string;
  readonly city: string;
  /** @ do Instagram sem a arroba, se ela autorizou. */
  readonly instagram?: string;
  /** Data da autorização, AAAA-MM-DD. */
  readonly approvedAt: string;
};

export const TESTIMONIALS: readonly Testimonial[] = [];
