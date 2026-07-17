import { Router } from "express";

import { config } from "../config";

export const healthRouter: Router = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "lucro-caseiro-api",
    // Diagnóstico de config: booleans (NUNCA o valor) pra checar se cada
    // segredo opcional foi lido no boot. Ex.: accountDeletion=false → falta
    // SUPABASE_SERVICE_ROLE_KEY no host.
    config: {
      accountDeletion: Boolean(config.supabaseServiceRoleKey),
      googlePlay: Boolean(config.googlePlayServiceAccountJson),
      marketingAi: Boolean(config.googleGenerativeAiApiKey),
      stripe: Boolean(config.stripeSecretKey),
    },
  });
});
