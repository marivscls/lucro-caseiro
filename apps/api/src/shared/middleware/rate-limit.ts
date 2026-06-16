import type { NextFunction, Request, Response } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

/**
 * Rate limiter simples em memória (janela fixa) por IP. Barreira contra abuso e
 * rajada de requisições — não substitui um WAF, mas limita o estrago num servidor
 * único (Railway). A janela reinicia a cada `windowMs`. Requer `trust proxy` para
 * `req.ip` ser o IP real do cliente atrás do proxy.
 */
export function rateLimit({ windowMs, max }: RateLimitOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = req.ip ?? "unknown";

    let entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    // Limpeza preguiçosa pra o Map não crescer indefinidamente.
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        if (now >= v.resetAt) hits.delete(k);
      }
    }

    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({
        error: "Muitas requisições em pouco tempo. Tente novamente em instantes.",
        code: "RATE_LIMITED",
      });
      return;
    }

    next();
  };
}
