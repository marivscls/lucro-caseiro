import { createHash } from "node:crypto";
import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = join(appRoot, "dist");
const indexPath = join(distRoot, "index.html");

const exportedHtml = await readFile(indexPath, "utf8");
const moduleHtml = exportedHtml.replace(
  /<script src="(\/_expo\/static\/js\/web\/[^"]+\.js)" defer><\/script>/g,
  '<script type="module" src="$1" defer></script>',
);

if (!moduleHtml.includes('type="module" src="/_expo/static/js/web/')) {
  throw new Error("O export web não contém o bundle esperado do Expo.");
}

await writeFile(indexPath, moduleHtml, "utf8");
const buildFingerprint = createHash("sha256").update(moduleHtml);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

const normalizePath = (path) => `/${relative(distRoot, path).split(sep).join("/")}`;

const essentialFontNames = [
  "Fraunces_600SemiBold",
  "Fraunces_700Bold",
  "NunitoSans_400Regular",
  "NunitoSans_600SemiBold",
  "NunitoSans_700Bold",
  "NunitoSans_800ExtraBold",
];

const iconFontPath = join(distRoot, "ionicons.ttf");
await copyFile(
  join(
    appRoot,
    "node_modules",
    "@expo",
    "vector-icons",
    "build",
    "vendor",
    "react-native-vector-icons",
    "Fonts",
    "Ionicons.ttf",
  ),
  iconFontPath,
);

const webBundleDirectory = join(distRoot, "_expo", "static", "js", "web");
const bundleNames = await readdir(webBundleDirectory);
for (const bundleName of bundleNames.filter((name) => name.endsWith(".js"))) {
  const bundlePath = join(webBundleDirectory, bundleName);
  const bundle = await readFile(bundlePath, "utf8");
  const normalizedBundle = bundle.replace(
    /"\/assets\/[^"]*\/Ionicons\.[a-f0-9]+\.ttf"/g,
    '"/ionicons.ttf"',
  );
  await writeFile(bundlePath, normalizedBundle, "utf8");
  buildFingerprint.update(normalizedBundle);
}

const files = await listFiles(distRoot);
const shellUrls = files
  .map(normalizePath)
  .filter(
    (path) =>
      [
        "/index.html",
        "/manifest.json",
        "/favicon.ico",
        "/icon-192.png",
        "/icon-512.png",
        "/ionicons.ttf",
      ].includes(path) ||
      path.startsWith("/_expo/static/js/") ||
      essentialFontNames.some((font) => path.includes(`/${font}.`)),
  )
  .sort();

if (
  !shellUrls.includes("/index.html") ||
  !shellUrls.some((path) => path.endsWith(".js"))
) {
  throw new Error("O export web não contém o shell esperado do Expo.");
}

const cacheVersion = buildFingerprint
  .update(shellUrls.join("\n"))
  .digest("hex")
  .slice(0, 12);
const serviceWorker = `const CACHE_NAME = "lucro-caseiro-${cacheVersion}";
const APP_SHELL = ${JSON.stringify(["/", ...shellUrls], null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        APP_SHELL.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) await cache.put(url, response);
          } catch {
            // Um recurso visual opcional não pode impedir a instalação do shell.
          }
        }),
      );

      if (!(await cache.match("/index.html"))) {
        throw new Error("O shell principal não pôde ser armazenado offline.");
      }
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(async () => (await caches.match(event.request)) || caches.match("/index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    }),
  );
});
`;

await writeFile(join(distRoot, "sw.js"), serviceWorker, "utf8");
console.log(`PWA service worker gerado com ${shellUrls.length} recursos essenciais.`);
