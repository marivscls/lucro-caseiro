#!/usr/bin/env node
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";

import { selectImageAdapter } from "./src/image-adapters.mjs";
import { selectStorage } from "./src/storage.mjs";

// Worker de geração: POST { prompt, slug } -> gera a imagem (adapter) ->
// se houver storage, faz upload e devolve { url }; senão devolve { b64 }.
// É exatamente o endpoint que o provider `http` da CLI consome.

const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.ASSET_FORGE_HOST || "127.0.0.1";
const API_KEY = process.env.ASSET_FORGE_API_KEY || "";
if (!["127.0.0.1", "::1", "localhost"].includes(HOST) && !API_KEY.trim()) {
  throw new Error("ASSET_FORGE_API_KEY é obrigatória para escutar fora do loopback.");
}
const imageAdapter = selectImageAdapter();
const storage = selectStorage();

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isAuthorized(req) {
  if (!API_KEY) return true;
  const actual = Buffer.from(req.headers.authorization ?? "");
  const expected = Buffer.from(`Bearer ${API_KEY}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;
    let tooLarge = false;
    req.on("data", (chunk) => {
      if (tooLarge) return;
      bytes += chunk.length;
      if (bytes > 1_000_000) {
        tooLarge = true;
        reject(new RequestError(413, "Conteúdo muito grande."));
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (tooLarge) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new RequestError(400, "JSON inválido."));
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
    if (!isAuthorized(req)) {
      send(res, 401, { error: "Não autorizado." });
      return;
    }
    if (
      req.headers["content-type"]?.split(";")[0].trim().toLowerCase() !==
      "application/json"
    ) {
      send(res, 415, { error: "Use application/json." });
      return;
    }
    try {
      const payload = await readJson(req);
      const { prompt, slug } = payload && typeof payload === "object" ? payload : {};
      if (
        typeof slug !== "string" ||
        slug.length > 100 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      ) {
        send(res, 400, {
          error: "Slug inválido: use até 100 letras minúsculas, números e hífens.",
        });
        return;
      }
      if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 16_000) {
        send(res, 400, { error: "Prompt obrigatório, com até 16000 caracteres." });
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
      send(res, err instanceof RequestError ? err.status : 500, {
        error:
          err instanceof RequestError ? err.message : "Não foi possível gerar a imagem.",
      });
    }
  })();
});

server.listen(PORT, HOST, () => {
  console.log(
    `asset-forge worker em http://${HOST}:${PORT}  (imagem: ${imageAdapter.name}, storage: ${storage?.name ?? "local/b64"})`,
  );
});
