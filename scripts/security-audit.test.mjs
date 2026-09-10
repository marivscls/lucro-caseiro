import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { assessAudit, verifyPatch } from "./security-audit.mjs";

function advisory(overrides = {}) {
  return {
    module_name: "image-size",
    severity: "high",
    url: "https://github.com/advisories/GHSA-w3rx-r6r6-pgpr",
    findings: [{ version: "1.2.1", paths: [". > image-size@1.2.1"] }],
    ...overrides,
  };
}
function audit(item = advisory()) {
  return {
    advisories: { 1: item },
    metadata: {
      vulnerabilities: {
        high: item.severity === "high" ? 1 : 0,
        critical: item.severity === "critical" ? 1 : 0,
      },
    },
  };
}

test("only the exact known advisory and version can be mitigated", () => {
  let verified = false;
  const result = assessAudit(audit(), () => {
    verified = true;
  });
  assert.equal(verified, true);
  assert.equal(result.mitigated.length, 1);
  assert.equal(result.blocking.length, 0);
});

test("missing patch verification blocks a known advisory", () => {
  const result = assessAudit(audit(), () => {
    throw new Error("Patch ausente");
  });
  assert.equal(result.mitigated.length, 0);
  assert.equal(result.blocking.length, 1);
});

test("an unrelated new high or critical advisory is never suppressed", () => {
  for (const severity of ["high", "critical"]) {
    const result = assessAudit(
      audit(
        advisory({ severity, url: "https://github.com/advisories/GHSA-new-advisory" }),
      ),
      () => assert.fail("must not verify unrelated advisory"),
    );
    assert.equal(result.blocking.length, 1);
  }
});

test("the known advisory on a different package or version remains blocking", () => {
  for (const changes of [
    { module_name: "another-package" },
    { findings: [{ version: "2.0.2", paths: [". > image-size@2.0.2"] }] },
  ]) {
    const result = assessAudit(audit(advisory(changes)), () =>
      assert.fail("must not accept another version"),
    );
    assert.equal(result.blocking.length, 1);
  }
});

test("new moderate advisories preserve audit-level high", () => {
  const result = assessAudit(
    audit(
      advisory({
        severity: "moderate",
        url: "https://github.com/advisories/GHSA-new-advisory",
      }),
    ),
    () => {},
  );
  assert.equal(result.other.length, 1);
  assert.equal(result.blocking.length, 0);
});

test("malformed or incomplete audit results fail closed", () => {
  for (const value of [
    {},
    { error: "registry unavailable" },
    { advisories: {}, metadata: { vulnerabilities: { high: 1, critical: 0 } } },
  ]) {
    assert.throws(() => assessAudit(value, () => {}));
  }
});

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "lucro-audit-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "patches"));
  mkdirSync(join(root, "node_modules/image-size"), { recursive: true });
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  const patch = {
    name: "image-size",
    version: "1.2.1",
    patch: "patches/image.patch",
    sha256: digest("reviewed patch\n"),
    lockHash: "reviewed-hash",
    files: { "index.js": digest("fixed source\n") },
  };
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      pnpm: { patchedDependencies: { "image-size@1.2.1": patch.patch } },
    }),
  );
  writeFileSync(join(root, patch.patch), "reviewed patch\n");
  writeFileSync(
    join(root, "pnpm-lock.yaml"),
    "patchedDependencies:\n  image-size@1.2.1:\n    hash: reviewed-hash\n    path: patches/image.patch\nsnapshots:\n  consumer:\n    dependencies:\n      image-size: 1.2.1(patch_hash=reviewed-hash)\n",
  );
  writeFileSync(
    join(root, "node_modules/image-size/package.json"),
    JSON.stringify({ name: "image-size", version: "1.2.1" }),
  );
  writeFileSync(join(root, "node_modules/image-size/index.js"), "fixed source\n");
  return { root, patch, findings: advisory().findings };
}

test("patch identity, lockfile, and effective installed code must all match", (t) => {
  const { root, patch, findings } = fixture(t);
  assert.doesNotThrow(() => verifyPatch(root, patch, findings));
});

test("changed patch bytes fail verification", (t) => {
  const { root, patch, findings } = fixture(t);
  writeFileSync(join(root, patch.patch), "unreviewed patch\n");
  assert.throws(() => verifyPatch(root, patch, findings), /Hash de patch alterado/);
});

test("unpatched installed source fails even with the correct patch and lockfile", (t) => {
  const { root, patch, findings } = fixture(t);
  writeFileSync(join(root, "node_modules/image-size/index.js"), "vulnerable source\n");
  assert.throws(() => verifyPatch(root, patch, findings), /Codigo instalado sem patch/);
});

test("missing manifest patch configuration fails verification", (t) => {
  const { root, patch, findings } = fixture(t);
  writeFileSync(join(root, "package.json"), "{}");
  assert.throws(() => verifyPatch(root, patch, findings), /Patch ausente/);
});

test("an unpatched lockfile reference fails verification", (t) => {
  const { root, patch, findings } = fixture(t);
  writeFileSync(
    join(root, "pnpm-lock.yaml"),
    "patchedDependencies:\n  image-size@1.2.1:\n    hash: reviewed-hash\n    path: patches/image.patch\nsnapshots:\n  consumer:\n    dependencies:\n      image-size: 1.2.1\n",
  );
  assert.throws(() => verifyPatch(root, patch, findings), /Referencia sem patch/);
});
