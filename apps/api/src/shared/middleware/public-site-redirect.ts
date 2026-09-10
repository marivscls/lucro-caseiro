import type { NextFunction, Request, Response } from "express";

/** Reuse the API's available Railway domain slot only for the public www alias. */
export function publicSiteRedirect(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.hostname.toLowerCase() !== "www.lucrocaseiro.com.br") {
    next();
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).end();
    return;
  }

  const path = req.originalUrl.replace(/^\/landing(?=\?|$)/, "/");
  // Concatenation keeps even //paths on our fixed origin (never an open redirect).
  res.redirect(308, `https://lucrocaseiro.com.br${path}`);
}
