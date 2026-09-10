import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { httpProvider } from "../src/providers.mjs";

async function startWorker(t, extraEnv = {}) {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL("../worker.mjs", import.meta.url))],
    {
      env: {
        ...process.env,
        OPENAI_API_KEY: "",
        SUPABASE_URL: "",
        SUPABASE_SERVICE_KEY: "",
        ASSET_FORGE_API_KEY: "",
        ASSET_FORGE_HOST: "127.0.0.1",
        PORT: String(port),
        ...extraEnv,
      },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  t.after(() => child.kill());
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });
  const base = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) return { child, base, output };
    try {
      if ((await fetch(`${base}/health`)).ok) return { child, base, output };
    } catch {
      /* starting */
    }
    await delay(25);
  }
  throw new Error(`Worker did not start: ${output}`);
}

function generate(base, body, token) {
  return fetch(base, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

test("configured worker rejects missing or wrong bearer tokens", async (t) => {
  const { base } = await startWorker(t, { ASSET_FORGE_API_KEY: "worker-test-token" });
  const body = { prompt: "Um ingrediente", slug: "farinha" };
  assert.equal((await generate(base, body)).status, 401);
  assert.equal((await generate(base, body, "incorrect-token")).status, 401);
  const response = await generate(base, body, "worker-test-token");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).contentType, "image/png");
  const provider = httpProvider({
    ASSET_FORGE_IMAGE_ENDPOINT: base,
    ASSET_FORGE_API_KEY: "worker-test-token",
  });
  const generated = await provider.generate(body);
  assert.equal(generated.status, "ready");
  assert.equal(generated.contentType, "image/png");
  assert.ok(Buffer.isBuffer(generated.bytes));
});

test("worker refuses remote binding without an API key", async (t) => {
  const { child } = await startWorker(t, { ASSET_FORGE_HOST: "0.0.0.0" });
  assert.notEqual(
    child.exitCode,
    null,
    "worker must stop instead of exposing an unauthenticated endpoint",
  );
  assert.notEqual(child.exitCode, 0);
});

test("loopback stub accepts valid input and rejects unsafe slugs and malformed requests", async (t) => {
  const { base } = await startWorker(t);
  for (const slug of [
    "../private/object",
    "a/b",
    "a%2Fb",
    "a?x=1",
    "a\\b",
    "a".repeat(101),
    { key: "bad" },
  ]) {
    assert.equal((await generate(base, { prompt: "Um ingrediente", slug })).status, 400);
  }
  assert.equal((await generate(base, { slug: "farinha" })).status, 400);
  assert.equal(
    (await generate(base, { slug: "farinha", prompt: "x".repeat(16_001) })).status,
    400,
  );
  assert.equal(
    (await generate(base, { slug: "farinha", prompt: "x".repeat(1_000_001) })).status,
    413,
  );
  assert.equal(
    (
      await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await fetch(base, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: '{"slug":"farinha","prompt":"teste"}',
      })
    ).status,
    415,
  );
  const response = await generate(base, { slug: "farinha", prompt: "Um ingrediente" });
  assert.equal(response.status, 200);
  assert.ok((await response.json()).b64);
});

test("worker does not return upstream error contents to callers", async (t) => {
  const upstream = createServer((_req, res) => {
    res.writeHead(500);
    res.end("private-upstream-marker");
  });
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");
  t.after(() => upstream.close());
  const { base } = await startWorker(t, {
    SUPABASE_URL: `http://127.0.0.1:${upstream.address().port}`,
    SUPABASE_SERVICE_KEY: "fake-test-key",
  });
  const response = await generate(base, { slug: "farinha", prompt: "Um ingrediente" });
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /private-upstream-marker|Supabase upload/);
});
