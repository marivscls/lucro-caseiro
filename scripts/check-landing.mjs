import assert from "node:assert/strict";

// Read-only smoke check against a local production server or the published site.
const base = process.argv[2] ?? "https://lucrocaseiro.com.br";
const canonical = "https://lucrocaseiro.com.br";
const paths = [
  "/",
  "/landing/calculadora",
  "/landing/privacidade",
  "/landing/termos",
  "/landing/excluir-conta",
  "/landing/suporte",
  "/landing/guias/como-calcular-preco-de-venda",
  "/landing/guias/precificacao-para-confeitaria",
  "/landing/guias/como-colocar-mao-de-obra-no-preco",
];
const local = new URL(base).hostname === "localhost";
const headers = local ? { "x-forwarded-host": "lucrocaseiro.com.br" } : {};
const results = [];
const get = (path) => fetch(new URL(path, base), { headers, redirect: "manual" });

for (const path of paths) {
  const response = await get(path);
  assert.equal(response.status, 200, `${path}: HTTP`);
  assert.ok(
    response.headers.get("content-security-policy")?.includes("frame-ancestors 'none'"),
    `${path}: CSP`,
  );
  const html = await response.text();
  const canonicalLink = html.match(/<link rel="canonical" href="([^"]+)"/u)?.[1];
  assert.equal(new URL(canonicalLink).href, `${canonical}${path}`, `${path}: canonical`);
  assert.match(html, /<meta name="robots" content="index, follow"/u, `${path}: robots`);
  assert.doesNotMatch(
    html,
    /<meta name="robots" content="[^"]*noindex/u,
    `${path}: no unexpected noindex`,
  );
  assert.equal((html.match(/<h1[\s>]/gu) ?? []).length, 1, `${path}: one h1`);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/lucrocaseiro.com.br\/landing\/opengraph-image/u,
    `${path}: share image`,
  );
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/u);
  for (const match of html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gu,
  ))
    JSON.parse(match[1]);
  results.push({ path, status: response.status, canonical: canonicalLink });
}
const redirect = await get("/landing?utm_source=check");
assert.equal(redirect.status, 308);
assert.equal(redirect.headers.get("location"), `${canonical}/?utm_source=check`);

const wwwRedirects = [];
if (new URL(base).origin === canonical) {
  for (const [path, target] of [
    ["/", "/"],
    ["/landing?utm_source=check", "/?utm_source=check"],
    ["/landing/calculadora?utm_source=check", "/landing/calculadora?utm_source=check"],
  ]) {
    // Normal TLS verification must succeed before checking the HTTP redirect.
    const response = await fetch(`https://www.lucrocaseiro.com.br${path}`, {
      method: "HEAD",
      redirect: "manual",
    });
    assert.equal(response.status, 308, `www ${path}: permanent redirect`);
    assert.equal(response.headers.get("location"), `${canonical}${target}`);
    wwwRedirects.push({ path, status: response.status });
  }
}

const robots = await (await get("/robots.txt")).text();
const rules = [...robots.matchAll(/^(Allow|Disallow):\s*(.+)$/gmu)].map(
  ([, action, pattern]) => ({ action, pattern }),
);
function allowed(path) {
  const matches = rules.filter(({ pattern }) =>
    pattern.endsWith("$") ? path === pattern.slice(0, -1) : path.startsWith(pattern),
  );
  matches.sort(
    (a, b) => b.pattern.length - a.pattern.length || (a.action === "Allow" ? -1 : 1),
  );
  return matches[0]?.action !== "Disallow";
}
for (const path of [
  ...paths,
  "/_next/static/chunks/example.js",
  "/_next/image?url=example",
])
  assert.ok(allowed(path), `Crawlable: ${path}`);
for (const path of ["/login", "/ai", "/calendar", "/documents", "/video-editor"])
  assert.ok(!allowed(path), `Excluded: ${path}`);

const sitemap = await (await get("/sitemap.xml")).text();
assert.equal((sitemap.match(/<loc>/gu) ?? []).length, paths.length);
assert.ok(sitemap.includes(`<loc>${canonical}/</loc>`));
assert.ok(!sitemap.includes(`<loc>${canonical}/landing</loc>`));
const image = await get("/landing/opengraph-image");
assert.equal(image.status, 200);
assert.equal(image.headers.get("content-type"), "image/png");
const bytes = new Uint8Array(await image.arrayBuffer());
assert.equal(Buffer.from(bytes.slice(1, 4)).toString(), "PNG");
assert.equal(new DataView(bytes.buffer).getUint32(16), 1200);
assert.equal(new DataView(bytes.buffer).getUint32(20), 630);
console.log(
  JSON.stringify(
    {
      base,
      pages: results,
      legacyRedirect: redirect.status,
      wwwRedirects,
      crawlRules: "passed",
      sitemap: "passed",
      socialImage: "1200x630 PNG",
    },
    null,
    2,
  ),
);
