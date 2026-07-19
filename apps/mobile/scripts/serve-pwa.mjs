import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const brandId = process.argv[2]?.trim();
const port = Number(process.argv[3]);

if (!brandId || !/^[a-z0-9-]+$/.test(brandId)) {
  throw new Error("Informe a marca que sera servida.");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Informe uma porta valida.");
}

const root = join(appRoot, "dist", brandId);
const indexPath = join(root, "index.html");
await stat(indexPath).catch(() => {
  throw new Error(`Gere o PWA ${brandId} antes de inicia-lo.`);
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
    const filePath = await findFile(url.pathname);
    if (!filePath) {
      response.writeHead(400).end("Caminho invalido");
      return;
    }

    const extension = extname(filePath).toLowerCase();
    const noCache = extension === ".html" || filePath.endsWith("sw.js");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Cache-Control": noCache ? "no-cache" : "public, max-age=3600",
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(503, { "Retry-After": "1" }).end("PWA sendo atualizado");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`PWA ${brandId} em http://localhost:${port}`);
});
