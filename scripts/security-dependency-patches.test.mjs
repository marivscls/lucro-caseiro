import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { test } from "node:test";

const mobileRequire = createRequire(
  new URL("../apps/mobile/package.json", import.meta.url),
);

function dependencyPath(chain) {
  let require = mobileRequire;
  for (const name of chain.slice(0, -1)) {
    require = createRequire(require.resolve(`${name}/package.json`));
  }
  return require.resolve(chain.at(-1));
}

const imageSize = process.env.TEST_DEPENDENCY_DIR
  ? resolve(process.env.TEST_DEPENDENCY_DIR, "image-size/dist/index.js")
  : dependencyPath([
      "react-native",
      "@react-native/community-cli-plugin",
      "metro",
      "image-size",
    ]);
const decoder = process.env.TEST_DEPENDENCY_DIR
  ? resolve(process.env.TEST_DEPENDENCY_DIR, "decode-uri-component/index.js")
  : dependencyPath([
      "expo-router",
      "@react-navigation/native",
      "@react-navigation/core",
      "query-string",
      "decode-uri-component",
    ]);

// Isolate malformed-input probes: a regression must fail rather than hang the runner.
function runProbe(modulePath, body) {
  const child = spawnSync(process.execPath, ["-e", body, modulePath], {
    encoding: "utf8",
    timeout: 2000,
    maxBuffer: 64 * 1024,
  });
  assert.equal(child.error, undefined, child.error?.message);
  assert.equal(child.status, 0, child.stderr);
}

test("image-size rejects ICNS entries with zero or undersized lengths", () => {
  runProbe(
    imageSize,
    `
    const assert = require('node:assert/strict');
    const size = require(process.argv[1]);
    for (const entryLength of [0, 1, 7]) {
      const image = Buffer.alloc(24);
      image.write('icns'); image.writeUInt32BE(24, 4);
      image.write('icp4', 8); image.writeUInt32BE(entryLength, 12);
      assert.throws(() => size(image));
    }
  `,
  );
});

test("image-size rejects JXL partial stream boxes that cannot advance", () => {
  runProbe(
    imageSize,
    `
    const assert = require('node:assert/strict');
    const size = require(process.argv[1]);
    const image = Buffer.alloc(40);
    image.writeUInt32BE(12); image.write('JXL ', 4);
    image.writeUInt32BE(16, 12); image.write('ftyp', 16); image.write('jxl ', 20);
    image.write('jxlp', 32);
    assert.throws(() => size(image));
  `,
  );
});

test("image-size rejects invalid HEIF boxes and keeps valid image dimensions", () => {
  runProbe(
    imageSize,
    `
    const assert = require('node:assert/strict');
    const size = require(process.argv[1]);
    const heif = Buffer.alloc(24);
    heif.write('ftyp', 4); heif.write('heic', 8);
    assert.throws(() => size(heif));
    const icns = Buffer.alloc(16);
    icns.write('icns'); icns.writeUInt32BE(16, 4);
    icns.write('icp4', 8); icns.writeUInt32BE(8, 12);
    assert.equal(size(icns).width, 16);
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6j2sAAAAASUVORK5CYII=', 'base64');
    assert.equal(size(png).width, 1); assert.equal(size(png).height, 1);
  `,
  );
});

test("CommonJS URI decoder handles long malformed runs without recursive denial of service", () => {
  runProbe(
    decoder,
    `
    const assert = require('node:assert/strict');
    const decode = require(process.argv[1]);
    const malformed = '%FF'.repeat(10000);
    assert.equal(decode(malformed), malformed);
    assert.equal(decode('caf%C3%A9+com+leite'), 'café com leite');
    assert.equal(decode('%E0%A4%A'), '%E0%A4%A');
    assert.equal(decode('%FE%FF'), '\\uFFFD\\uFFFD');
    assert.equal(decode('%C2'), '\\uFFFD');
    assert.throws(() => decode(null), TypeError);
  `,
  );
});
