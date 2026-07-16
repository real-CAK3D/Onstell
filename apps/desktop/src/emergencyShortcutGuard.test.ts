import {
  emergencyShortcutGuard,
  emergencyShortcutSpikeFlag,
  shortcutPlanForPlatform
} from "./emergencyShortcutGuard";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runEmergencyShortcutGuardTests() {
  let count = 0;

  const defaultGuard = emergencyShortcutGuard({}, "production", "windows");
  assert(defaultGuard.enabled === false, "global shortcut must default off");
  assert(defaultGuard.status === "not-registered", "default guard must not register a shortcut");
  assert(defaultGuard.reason === "not-requested", "default guard should report not-requested");
  assert(defaultGuard.accelerator === "Ctrl+Alt+Escape", "Windows/Linux shortcut should be Ctrl+Alt+Escape");
  count += 1;

  const productionGuard = emergencyShortcutGuard({ [emergencyShortcutSpikeFlag]: "1" }, "production", "windows");
  assert(productionGuard.enabled === false, "global shortcut flag must be blocked outside development");
  assert(productionGuard.status === "not-registered", "production guard must not register a shortcut");
  assert(productionGuard.reason === "non-dev-build", "production guard should report non-dev-build");
  count += 1;

  const devGuard = emergencyShortcutGuard({ [emergencyShortcutSpikeFlag]: "true" }, "development", "linux");
  assert(devGuard.enabled === true, "global shortcut prototype may only be allowed in development");
  assert(devGuard.status === "prototype-allowed", "development guard should allow a future prototype");
  assert(devGuard.reason === "dev-spike-enabled", "development guard should report dev-spike-enabled");
  assert(devGuard.fallback.includes("Release Input"), "fallback must keep the reliable Release Input path");
  count += 1;

  const macPlan = shortcutPlanForPlatform("macos");
  assert(macPlan.accelerator === "Control+Option+Escape", "macOS shortcut should use Control+Option+Escape");
  assert(macPlan.fallback.includes("tray Release Input"), "platform plan should document tray fallback");
  count += 1;

  return count;
}
