import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { cpus } from "node:os";
import { join } from "node:path";

export const MODEL_REFERENCES = {
  "model-legacy.json":
    "fc735637f05dfd8aebce2ea75e1f5704f37248c4404ab40ef0117ded0dfcc133",
  "model-linux.json":
    "4a5c17184d858df46f40ffdb34c78ebca1afd3dbb2327b599299efc38f13bbe6",
};
export const MODEL_RUNTIME_ASSET = {
  file: "libonnxruntime.so.1",
  bytes: 45828512,
  sha256: "ffb75a925ba05e47b235bb66e3e3911714a80b328a9c9425539feb204aa32a23",
};
const references = MODEL_REFERENCES;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/u;

async function qualifiedReference(directory) {
  assert.equal(process.platform, "linux");
  assert.equal(process.arch, "x64");
  assert.deepEqual(
    [...new Set(cpus().map(({ model }) => model))],
    ["AMD Ryzen 7 7800X3D 8-Core Processor"],
  );
  const decoded = {};
  for (const [name, expected] of Object.entries(references)) {
    const bytes = await readFile(join(directory, name));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected);
    decoded[name] = JSON.parse(bytes.toString("utf8"));
  }
  const fixture = decoded["model-linux.json"];
  assert.equal(fixture.queries.length, 6);
  assert.equal(fixture.chunks.length, 6);
  for (const row of fixture.queries) assert.equal(row.vector.length, 384);
  return fixture;
}

const document = (index, text) => ({
  path: `${index}.md`,
  name: `Record ${index}`,
  extension: "md",
  checksum: "retained-model-reference",
  content: text,
  tags: [],
  tagParts: [],
  tagHierarchy: [],
  chunks: [
    { id: `${index}.md#0`, text, startOffset: 0, endOffset: text.length },
  ],
});

async function assertModel(call, fixture) {
  for (const [index, row] of fixture.queries.entries()) {
    const record = await call("getSearchDocument", `${index}.md`);
    const embedding = record?.chunks?.[0]?.embedding;
    assert.equal(embedding?.status, "ready");
    assert.equal(embedding.modelId, fixture.modelId);
    assert.equal(embedding.dimensions, 384);
    assert.equal(embedding.vector.length, 384);
    assert.equal(embedding.fingerprint, fixture.chunks[index].fingerprint);
    for (const [dimension, value] of row.vector.entries())
      assert.ok(Math.abs(embedding.vector[dimension] - value) < 0.00001);
  }
  assert.equal((await call("getSearchIndexStats")).readyChunkCount, 6);
  const revision = await call("getChangeRevision");
  assert.ok(Number.isSafeInteger(revision) && revision >= 0);
  for (const row of fixture.queries) {
    const expected = fixture.queries
      .map((candidate, index) => ({
        path: `${index}.md`,
        score: candidate.vector.reduce(
          (sum, value, dimension) => sum + value * row.vector[dimension],
          0,
        ),
      }))
      .filter(({ score }) => score >= 0.2)
      .sort((a, b) => b.score - a.score);
    const results = await call("searchDocuments", row.text, {
      mode: "vector",
      includeDiagnostics: true,
    });
    assert.deepEqual(
      results.map(({ document: result }) => result.path),
      expected.map(({ path }) => path),
    );
    for (const [index, result] of results.entries()) {
      const score = result.scoreBreakdown?.vector;
      assert.equal(typeof score, "number");
      assert.ok(Math.abs(score - expected[index].score) < 0.0002);
      assert.equal(result.diagnostics?.providerKind, "transformers-js");
      assert.equal(result.diagnostics.appliedMode, "vector");
      assert.equal(result.diagnostics.vectorCandidateCount, expected.length);
      assert.deepEqual(result.matchedChunkIds, [result.document.path + "#0"]);
      assert.ok(result.snippets.length > 0);
    }
  }
  assert.equal(await call("getChangeRevision"), revision);
  const runtime = await call("getSearchEmbeddingRuntimeStatus");
  assert.equal(runtime.providerKind, "transformers-js");
  assert.equal(runtime.phase, "ready");
  assert.equal(runtime.modelId, fixture.modelId);
  return revision;
}

/** Actual image HTTP proof; the caller owns browser cookies and process restart. */
export async function imageModelPhase({
  request,
  origin,
  phase,
  state,
  directory = "/input",
}) {
  assert.ok(["seed", "check"].includes(phase));
  assert.equal(new URL(origin).origin, origin);
  const fixture = await qualifiedReference(directory);
  const configuration = {
    kind: "transformers-js",
    modelId: fixture.modelId,
    revision: fixture.revision,
    dtype: fixture.dtype,
    dimensions: 384,
    normalize: true,
    allowRemoteModels: false,
  };
  const checks = [];
  const headers = { "x-lapis-protocol": "3", origin };
  async function json(path, method = "GET", data, status = 200) {
    const response = await request.fetch(origin + "/api/v3" + path, {
      method,
      headers,
      ...(data === undefined ? {} : { data }),
    });
    assert.equal(response.status(), status, `${method} ${path}`);
    return status === 204 ? undefined : response.json();
  }
  const session = await json("/auth/current");
  assert.equal(typeof session.csrf_token, "string");
  assert.ok(session.csrf_token.length > 0);
  headers["x-lapis-csrf"] = session.csrf_token;
  let vaultId;
  if (phase === "seed") {
    assert.equal(
      state,
      undefined,
      "Model setup must not replay an existing phase",
    );
    const created = await json(
      "/vaults",
      "POST",
      { name: `Image model ${randomUUID()}` },
      201,
    );
    vaultId = created.vault_id;
    checks.push("separate model vault created through admitted HTTP");
  } else {
    assert.equal(state?.schema, 1);
    assert.deepEqual(state.references, references);
    assert.deepEqual(state.configuration, configuration);
    vaultId = state.vaultId;
  }
  assert.match(vaultId, uuid);
  const attach = async () => {
    const client = await json(`/vaults/${vaultId}/clients`, "POST", {
      protocol_version: 3,
    });
    assert.match(client.client_id, uuid);
    assert.equal(client.vault_id, vaultId);
    assert.ok(
      typeof client.generation === "string" && client.generation.length,
    );
    const path = `/clients/${client.client_id}`;
    return {
      call: async (method, ...args) => {
        const reply = await json(path + "/database", "POST", {
          method,
          args: args.map((value) =>
            value === undefined
              ? { kind: "undefined" }
              : { kind: "value", value },
          ),
        });
        assert.ok(reply?.kind === "value" || reply?.kind === "undefined");
        if (reply.kind === "undefined") return undefined;
        assert.ok(Object.hasOwn(reply, "value"));
        return reply.value;
      },
      close: () => json(path, "DELETE", undefined, 204),
    };
  };
  let current = await attach();
  let revision;
  try {
    if (phase === "seed") {
      assert.equal(await current.call("getSearchEmbeddingProvider"), null);
      await current.call("configureSearchEmbeddingProvider", configuration);
      for (const [index, row] of fixture.queries.entries())
        await current.call("upsertSearchDocument", document(index, row.text));
      checks.push("offline native runtime populated six exact model documents");
    }
    assert.deepEqual(
      await current.call("getSearchEmbeddingProvider"),
      configuration,
    );
    revision = await assertModel(current.call, fixture);
    if (phase === "check") assert.equal(revision, state.revision);
    checks.push(
      `${phase}: qualified vectors, fingerprints, ranks and unchanged query revision`,
    );
  } finally {
    await current.close();
  }
  if (phase === "seed") {
    current = await attach();
    try {
      assert.deepEqual(
        await current.call("getSearchEmbeddingProvider"),
        configuration,
      );
      assert.equal(await assertModel(current.call, fixture), revision);
      checks.push(
        "passive detach and fresh admission preserve the offline model and revision",
      );
    } finally {
      await current.close();
    }
  } else checks.push("cold native process reused retained model state offline");
  return {
    state: { schema: 1, vaultId, revision, configuration, references },
    checks,
  };
}
