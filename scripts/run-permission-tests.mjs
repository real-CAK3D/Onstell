import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

const repoRoot = process.cwd();
const sourceFiles = [
  "apps/desktop/src/permissionModel.ts",
  "apps/desktop/src/permissionModel.test.ts"
].map((file) => path.join(repoRoot, file));

const outDir = await mkdtemp(path.join(tmpdir(), "onstell-permission-tests-"));

try {
  const tsc = path.join(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
  const compile = spawnSync(tsc, [
    "--target", "ES2022",
    "--module", "commonjs",
    "--strict",
    "--skipLibCheck",
    "--esModuleInterop",
    "--allowSyntheticDefaultImports",
    "--lib", "ES2022,DOM",
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
  const testModule = require(path.join(outDir, "permissionModel.test.js"));
  const count = testModule.runPermissionModelTests();
  console.log(`permission model tests passed (${count})`);
} finally {
  await rm(outDir, { recursive: true, force: true });
}
