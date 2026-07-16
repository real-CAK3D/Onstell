import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

const repoRoot = process.cwd();
const sourceFiles = [
  "apps/desktop/src/layoutModel.ts",
  "apps/desktop/src/routingModel.ts",
  "apps/desktop/src/loopbackFollower.ts",
  "apps/desktop/src/loopbackFollower.test.ts"
].map((file) => path.join(repoRoot, file));

const outDir = await mkdtemp(path.join(tmpdir(), "onstell-loopback-tests-"));

try {
  const tsc = path.join(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
  const compile = spawnSync(tsc, [
    "--target", "ES2022",
    "--module", "commonjs",
    "--strict",
    "--skipLibCheck",
    "--esModuleInterop",
    "--allowSyntheticDefaultImports",
    "--outDir", outDir,
    "--rootDir", path.join(repoRoot, "apps/desktop/src"),
    ...sourceFiles
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: "pipe"
  });
  if (compile.status !== 0) {
    throw new Error(compile.error?.message ?? `${compile.stdout ?? ""}${compile.stderr ?? ""}`);
  }

  await writeFile(path.join(outDir, "package.json"), JSON.stringify({ type: "commonjs" }));
  const require = createRequire(import.meta.url);
  const testModule = require(path.join(outDir, "loopbackFollower.test.js"));
  const count = testModule.runLoopbackFollowerTests();
  console.log(`loopback follower tests passed (${count})`);
} finally {
  await rm(outDir, { recursive: true, force: true });
}
