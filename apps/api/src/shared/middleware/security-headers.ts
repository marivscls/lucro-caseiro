import type { NextFunction, Request, Response } from "express";

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.set({
    "Content-Security-Policy":
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  next();
}
