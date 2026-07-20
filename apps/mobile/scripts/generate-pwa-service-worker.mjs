import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BRAND_ID = "lucro-caseiro";
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const brandsRoot = resolve(appRoot, "../../packages/brands");

const buildArgumentIndex = process.argv.indexOf("--build");
const buildBrandId =
  buildArgumentIndex >= 0 ? process.argv[buildArgumentIndex + 1]?.trim() : undefined;
if (buildArgumentIndex >= 0 && !buildBrandId) {
  throw new Error("Informe a marca depois de --build.");
}

const activeBrandId =
  buildBrandId ||
  process.env.BRAND?.trim() ||
  process.env.EXPO_PUBLIC_BRAND?.trim() ||
  process.env.NEXT_PUBLIC_BRAND?.trim() ||
  DEFAULT_BRAND_ID;
if (!/^[a-z0-9-]+$/.test(activeBrandId)) {
  throw new Error(`Marca invalida: ${activeBrandId}`);
}

const distRoot = join(appRoot, "dist", activeBrandId);
const indexPath = join(distRoot, "index.html");

const brandConfigPath = join(brandsRoot, "src", activeBrandId, "brand.json");
let activeBrand;
try {
  activeBrand = JSON.parse(await readFile(brandConfigPath, "utf8"));
} catch (error) {
  throw new Error(`Nao foi possivel carregar a marca ${activeBrandId}.`, {
    cause: error,
  });
}
if (activeBrand.id !== activeBrandId) {
  throw new Error(`Config de marca inconsistente: ${activeBrandId}`);
}

if (buildBrandId) {
  const pnpmExecutable = process.env.npm_execpath;
  const command = pnpmExecutable
    ? process.execPath
    : process.platform === "win32"
      ? "pnpm.cmd"
      : "pnpm";
  const args = pnpmExecutable
    ? [
        pnpmExecutable,
        "exec",
        "expo",
        "export",
        "--platform",
        "web",
        "--output-dir",
        distRoot,
        "--clear",
      ]
    : [
        "exec",
        "expo",
        "export",
        "--platform",
        "web",
        "--output-dir",
        distRoot,
        "--clear",
      ];
  const result = spawnSync(command, args, {
    cwd: appRoot,
    env: {
      ...process.env,
      BRAND: activeBrandId,
      EXPO_PUBLIC_BRAND: activeBrandId,
    },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`O export web da marca ${activeBrandId} falhou.`);
  }
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`O HTML exportado nao contem ${label}.`);
  }
  return source.replace(pattern, replacement);
}

function pwaIconSource(size) {
  const brandIcon = join(brandsRoot, activeBrandId, "assets", `pwa-icon-${size}.png`);
  return activeBrandId === DEFAULT_BRAND_ID
    ? join(appRoot, "public", `icon-${size}.png`)
    : brandIcon;
}

const icon192 = await readFile(pwaIconSource(192));
const icon512 = await readFile(pwaIconSource(512));
await copyFile(pwaIconSource(192), join(distRoot, "icon-192.png"));
await copyFile(pwaIconSource(512), join(distRoot, "icon-512.png"));

const shortcutIcon = [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }];
const pwaProductNoun =
  activeBrand.copy.productNoun === "servico"
    ? "servi\u00e7o"
    : activeBrand.copy.productNoun;
const shortcuts = [
  {
    name: activeBrand.copy.saleLabel,
    short_name: activeBrand.copy.saleLabel.replace(/^Registrar\s+/i, ""),
    description: `${activeBrand.copy.saleLabel} no ${activeBrand.appName}`,
    url: "/tabs/new-sale",
    icons: shortcutIcon,
  },
  {
    name: `Precificar ${pwaProductNoun}`,
    short_name: "Precificar",
    description: "Calcule o pre\u00e7o ideal",
    url: "/pricing",
    icons: shortcutIcon,
  },
];
if (activeBrand.features.agendamento) {
  shortcuts.push({
    name: "Ver agenda",
    short_name: "Agenda",
    description: "Confira seus compromissos",
    url: "/tabs/agenda",
    icons: shortcutIcon,
  });
} else if (activeBrand.features.estoque) {
  shortcuts.push({
    name: activeBrand.copy.stockLabel,
    short_name: activeBrand.copy.stockLabel,
    description: `Consulte seus ${activeBrand.copy.productNounPlural}`,
    url: "/products",
    icons: shortcutIcon,
  });
}

const shortName =
  activeBrandId === DEFAULT_BRAND_ID
    ? "Lucro Caseiro"
    : activeBrand.appName.replace(/^Lucro (?:na|no)\s+/i, "");
const pwaName =
  activeBrandId === DEFAULT_BRAND_ID ? "Lucro Caseiro: Gest\u00e3o" : activeBrand.appName;
const description = `Organize seu neg\u00f3cio, vendas e finan\u00e7as com o ${pwaName}.`;
const manifest = {
  id: "/",
  name: pwaName,
  short_name: shortName,
  description,
  lang: "pt-BR",
  dir: "ltr",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "any",
  background_color: activeBrand.theme.background ?? activeBrand.theme.primarySoft,
  theme_color: activeBrand.theme.primary,
  categories: ["business", "finance", "productivity"],
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ],
  shortcuts,
};
const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(join(distRoot, "manifest.json"), manifestJson, "utf8");

const iconVersion = createHash("sha256")
  .update(icon192)
  .update(icon512)
  .digest("hex")
  .slice(0, 12);
const exportedHtml = await readFile(indexPath, "utf8");
let brandedHtml = exportedHtml.replace(
  /<script src="(\/_expo\/static\/js\/web\/[^"]+\.js)" defer><\/script>/g,
  '<script type="module" src="$1" defer></script>',
);
brandedHtml = replaceRequired(
  brandedHtml,
  /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
  `<meta name="description" content="${description}" />`,
  "a meta description",
);
brandedHtml = replaceRequired(
  brandedHtml,
  /<meta name="theme-color" content="[^"]*"\s*\/>/,
  `<meta name="theme-color" content="${activeBrand.theme.primary}" />`,
  "a cor de tema",
);
brandedHtml = replaceRequired(
  brandedHtml,
  /<meta name="apple-mobile-web-app-title" content="[^"]*"\s*\/>/,
  `<meta name="apple-mobile-web-app-title" content="${shortName}" />`,
  "o titulo Apple do PWA",
);
brandedHtml = replaceRequired(
  brandedHtml,
  /(<link\s+rel="icon"[\s\S]*?href=")[^"]+("[\s\S]*?\/>)/,
  `$1/icon-192.png?v=${iconVersion}$2`,
  "o favicon versionado",
);
brandedHtml = replaceRequired(
  brandedHtml,
  /<title>[^<]*<\/title>/,
  `<title>${pwaName}</title>`,
  "o titulo da pagina",
);
brandedHtml = replaceRequired(
  brandedHtml,
  /(body\s*\{[\s\S]*?background:\s*)#[0-9a-f]{6}/i,
  `$1${activeBrand.theme.background ?? activeBrand.theme.primarySoft}`,
  "o fundo da pagina",
);
brandedHtml = replaceRequired(
  brandedHtml,
  /<noscript>[^<]*<\/noscript>/,
  `<noscript>Ative o JavaScript para usar o ${pwaName}.</noscript>`,
  "a mensagem sem JavaScript",
);

if (!brandedHtml.includes('type="module" src="/_expo/static/js/web/')) {
  throw new Error("O export web nao contem o bundle esperado do Expo.");
}
await writeFile(indexPath, brandedHtml, "utf8");

const buildFingerprint = createHash("sha256")
  .update(brandedHtml)
  .update(manifestJson)
  .update(icon192)
  .update(icon512);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const filePath = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(filePath) : [filePath];
    }),
  );
  return nested.flat();
}

const normalizePath = (filePath) =>
  `/${relative(distRoot, filePath).split(sep).join("/")}`;
const essentialFontNames = [
  "Fraunces_600SemiBold",
  "Fraunces_700Bold",
  "NunitoSans_400Regular",
  "NunitoSans_600SemiBold",
  "NunitoSans_700Bold",
  "NunitoSans_800ExtraBold",
];

const webBundleDirectory = join(distRoot, "_expo", "static", "js", "web");
const bundleNames = await readdir(webBundleDirectory);
let bundleHasActiveBrand = false;
for (const bundleName of bundleNames.filter((name) => name.endsWith(".js"))) {
  const bundlePath = join(webBundleDirectory, bundleName);
  const bundle = await readFile(bundlePath, "utf8");
  buildFingerprint.update(bundle);
  bundleHasActiveBrand ||= bundle.includes(
    `\\\"brand\\\":\\\"${activeBrand.id}\\\"`,
  );
}

if (!bundleHasActiveBrand) {
  throw new Error(`O bundle exportado nao confirma a marca ${activeBrand.id}.`);
}

const files = await listFiles(distRoot);
const shellUrls = files
  .map(normalizePath)
  .filter(
    (filePath) =>
      [
        "/index.html",
        "/manifest.json",
        "/icon-192.png",
        "/icon-512.png",
      ].includes(filePath) ||
      filePath.startsWith("/_expo/static/js/") ||
      essentialFontNames.some((font) => filePath.includes(`/${font}.`)),
  )
  .sort();

if (
  !shellUrls.includes("/index.html") ||
  !shellUrls.some((filePath) => filePath.endsWith(".js"))
) {
  throw new Error("O export web nao contem o shell esperado do Expo.");
}

const cacheVersion = buildFingerprint
  .update(shellUrls.join("\n"))
  .digest("hex")
  .slice(0, 12);
const serviceWorker = `const CACHE_NAME = "${activeBrand.id}-${cacheVersion}";
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
            // Um recurso visual opcional nao pode impedir a instalacao do shell.
          }
        }),
      );

      if (!(await cache.match("/index.html"))) {
        throw new Error("O shell principal nao pode ser armazenado offline.");
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
console.log(
  `PWA ${pwaName} gerado em ${distRoot} com ${shellUrls.length} recursos essenciais.`,
);
