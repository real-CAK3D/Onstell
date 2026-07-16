import {
  createPermissionReadiness,
  detectCurrentPlatform,
  permissionStatusLabel,
  permissionSummary,
  type OnstellPlatform
} from "./permissionModel";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runPermissionModelTests() {
  let count = 0;

  const platforms: OnstellPlatform[] = ["windows", "macos", "linux", "unknown"];
  for (const platform of platforms) {
    const readiness = createPermissionReadiness(platform);
    assert(readiness.promptsEnabled === false, `${platform} readiness must not enable permission prompts`);
    assert(readiness.capture.status !== "granted", `${platform} capture must not default to granted`);
    assert(readiness.injection.status !== "granted", `${platform} injection must not default to granted`);
  }
  count += 1;

  const macos = createPermissionReadiness("macos");
  assert(macos.capture.status === "missing", "macOS capture should model missing permissions before prompts");
  assert(macos.injection.detail.includes("not requested"), "macOS injection copy should be honest about not requesting permission");
  count += 1;

  const windows = createPermissionReadiness("windows");
  assert(windows.capture.status === "unknown", "Windows capture should remain unknown until real detection exists");
  assert(permissionSummary(windows.capture).includes("Raw Input"), "Windows summary should mention Raw Input readiness");
  count += 1;

  const blocked = createPermissionReadiness("linux", {
    capture: { status: "blocked", detail: "Test override blocked by policy" }
  });
  assert(blocked.capture.status === "blocked", "permission model should represent blocked states");
  assert(permissionStatusLabel(blocked.capture.status) === "Blocked", "blocked status should have a label");
  count += 1;

  assert(detectCurrentPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)") === "windows", "should detect Windows user agent");
  assert(detectCurrentPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)") === "macos", "should detect macOS user agent");
  assert(detectCurrentPlatform("Mozilla/5.0 (X11; Linux x86_64)") === "linux", "should detect Linux user agent");
  assert(detectCurrentPlatform("Mystery") === "unknown", "should default unknown user agent to unknown");
  count += 1;

  return count;
}
