import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const brandId = process.argv[2]?.trim();
const port = Number(process.argv[3] ?? process.env.PORT ?? 8083);

if (!brandId || !/^[a-z0-9-]+$/.test(brandId)) {
  throw new Error("Informe a marca que sera servida.");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Informe uma porta valida.");
}

const root = join(appRoot, "dist", brandId);
const indexPath = join(root, "index.html");
const previewResetHtml = `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><title>Atualizando preview</title></head>
  <body>
    <p>Atualizando o Lucro Caseiro…</p>
    <script>
      Promise.all([
        "serviceWorker" in navigator
          ? navigator.serviceWorker.getRegistrations().then((items) =>
              Promise.all(items.map((item) => item.unregister())),
            )
          : Promise.resolve(),
        "caches" in window
          ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          : Promise.resolve(),
      ]).finally(() => {
        window.location.replace("/?preview-reset=" + Date.now());
      });
    </script>
  </body>
</html>`;
await stat(indexPath).catch(() => {
  throw new Error(`Gere o PWA ${brandId} antes de inicia-lo.`);
});

function inlineScriptHashes(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
    ([, source]) => `'sha256-${createHash("sha256").update(source).digest("base64")}'`,
  );
}

const indexHtml = await readFile(indexPath, "utf8");
const apiOrigin = process.env.EXPO_PUBLIC_API_URL
  ? new URL(process.env.EXPO_PUBLIC_API_URL).origin
  : "";
const supabaseOrigin = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? new URL(process.env.EXPO_PUBLIC_SUPABASE_URL).origin
  : "";
const createCsp = (html) =>
  [
    "default-src 'self'",
    `script-src 'self' ${inlineScriptHashes(html).join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin} ${supabaseOrigin}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
const securityHeaders = (html = indexHtml) => ({
  "Content-Security-Policy": createCsp(html),
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
});

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function findFile(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const candidate = resolve(root, `.${decodedPath}`);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) return null;

  try {
    const candidateStat = await stat(candidate);
    if (candidateStat.isFile()) return candidate;
    if (candidateStat.isDirectory()) {
      const directoryIndex = join(candidate, "index.html");
      if ((await stat(directoryIndex)).isFile()) return directoryIndex;
    }
  } catch {
    // Rotas do app usam o index como fallback.
  }
  return indexPath;
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname === "/__preview/reset") {
      response.writeHead(200, {
        ...securityHeaders(previewResetHtml),
        "Cache-Control": "no-store",
        "Clear-Site-Data": '"cache"',
        "Content-Type": "text/html; charset=utf-8",
      });
      response.end(previewResetHtml);
      return;
    }

    const filePath = await findFile(url.pathname);
    if (!filePath) {
      response.writeHead(400).end("Caminho invalido");
      return;
    }

    const extension = extname(filePath).toLowerCase();
    const noCache = extension === ".html" || filePath.endsWith("sw.js");
    const body = await readFile(filePath);
    response.writeHead(200, {
      ...securityHeaders(),
      "Cache-Control": noCache ? "no-cache" : "public, max-age=3600",
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response
      .writeHead(503, { ...securityHeaders(), "Retry-After": "1" })
      .end("PWA sendo atualizado");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`PWA ${brandId} em http://localhost:${port}`);
});
