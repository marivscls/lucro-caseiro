import { z } from "zod";

import { PixKeyType } from "../pix";

/** Atualiza (ou apaga, com nulls) a chave Pix de quem vende. */
export const UpdatePixSettingsDto = z.object({
  pixKeyType: PixKeyType.nullable(),
  pixKey: z.string().trim().max(100).nullable(),
  pixCity: z.string().trim().max(40).nullable().optional(),
});
export type UpdatePixSettings = z.infer<typeof UpdatePixSettingsDto>;

export const CreateFiadoLinkDto = z.object({
  clientId: z.string().uuid(),
});

/** Link público do extrato do fiado de um cliente (a URL completa é /f/:token). */
export const FiadoLinkDto = z.object({
  token: z.string(),
  clientId: z.string().uuid(),
});
export type FiadoLink = z.infer<typeof FiadoLinkDto>;
