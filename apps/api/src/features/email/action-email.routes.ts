import { Router } from "express";
import { z } from "zod";
import { authMiddleware, getUserId } from "../../shared/middleware/auth";

interface PreferenceRepo {
  getPreference(userId: string): Promise<boolean>;
  setPreference(userId: string, enabled: boolean): Promise<void>;
  unsubscribe(token: string): Promise<boolean>;
}

const preferenceBody = z.object({ actionEmails: z.boolean() }).strict();
const tokenPattern = /^[a-f0-9]{64}$/;

function page(content: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>Preferências de e-mail | Lucro Caseiro</title></head><body style="margin:0;padding:32px;background:#FAF8F6;font-family:Arial,Helvetica,sans-serif;color:#2C2A29"><main style="max-width:480px;margin:60px auto;padding:32px;background:white;border-radius:20px"><p style="font-weight:700;color:#B65F72">Lucro Caseiro</p>${content}</main></body></html>`;
}

export function createActionEmailRouter(repo: PreferenceRepo): Router {
  const router = Router();

  router.get("/unsubscribe/:token", (req, res) => {
    const token = req.params.token;
    if (typeof token !== "string" || !tokenPattern.test(token))
      return res.sendStatus(404);
    res.set("Cache-Control", "no-store").set("Referrer-Policy", "no-referrer");
    res
      .type("html")
      .send(
        page(
          `<h1>Parar de receber dicas por e-mail?</h1><p>Você continuará recebendo mensagens necessárias para acessar sua conta.</p><form method="post" action="/api/v1/email-preferences/unsubscribe/${token}"><button type="submit" style="border:0;border-radius:10px;background:#B65F72;color:white;padding:14px 20px;font-size:16px;cursor:pointer">Não quero mais dicas</button></form>`,
        ),
      );
  });

  router.post("/unsubscribe/:token", async (req, res, next) => {
    try {
      const token = req.params.token;
      if (typeof token !== "string" || !tokenPattern.test(token))
        return res.sendStatus(404);
      const found = await repo.unsubscribe(token);
      if (!found) return res.sendStatus(404);
      res.set("Cache-Control", "no-store").set("Referrer-Policy", "no-referrer");
      res
        .type("html")
        .send(
          page(
            "<h1>Pronto, dicas desativadas.</h1><p>Você pode ativá-las novamente nas configurações do app.</p>",
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  router.use(authMiddleware);
  router.get("/", async (req, res, next) => {
    try {
      res.json({ actionEmails: await repo.getPreference(getUserId(req)) });
    } catch (error) {
      next(error);
    }
  });
  router.put("/", async (req, res, next) => {
    try {
      const result = preferenceBody.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: "VALIDATION_ERROR" });
      await repo.setPreference(getUserId(req), result.data.actionEmails);
      res.json({ actionEmails: result.data.actionEmails });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
