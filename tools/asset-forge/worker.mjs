#!/usr/bin/env node
import { createServer } from "node:http";

import { selectImageAdapter } from "./src/image-adapters.mjs";
import { selectStorage } from "./src/storage.mjs";

// Worker de geração: POST { prompt, slug } -> gera a imagem (adapter) ->
// se houver storage, faz upload e devolve { url }; senão devolve { b64 }.
// É exatamente o endpoint que o provider `http` da CLI consome.

const PORT = Number(process.env.PORT) || 8787;
const imageAdapter = selectImageAdapter();
const storage = selectStorage();

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

const server = createServer((req, res) => {
  void (async () => {
    if (req.method === "GET" && req.url === "/health") {
      send(res, 200, {
        ok: true,
        image: imageAdapter.name,
        storage: storage?.name ?? "local/b64",
      });
      return;
    }
    if (req.method !== "POST") {
      send(res, 405, { error: "method not allowed" });
      return;
    }
    try {
      const { prompt, slug } = await readJson(req);
      if (!slug) {
        send(res, 400, { error: "slug obrigatório" });
        return;
      }
      const { bytes, contentType } = await imageAdapter.generate({ prompt, slug });
      if (storage) {
        const url = await storage.upload(`${slug}.png`, bytes, contentType);
        send(res, 200, { url });
      } else {
        send(res, 200, { b64: bytes.toString("base64"), contentType });
      }
    } catch (err) {
      send(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
  })();
});

server.listen(PORT, () => {
  console.log(
    `asset-forge worker em http://localhost:${PORT}  (imagem: ${imageAdapter.name}, storage: ${storage?.name ?? "local/b64"})`,
  );
});
