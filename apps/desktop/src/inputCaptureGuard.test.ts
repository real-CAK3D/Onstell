import { readOnlyCaptureGuard, readOnlyCaptureSpikeFlag } from "./inputCaptureGuard";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runInputCaptureGuardTests() {
  let count = 0;

  const defaultGuard = readOnlyCaptureGuard({}, "production");
  assert(defaultGuard.enabled === false, "read-only capture must default off");
  assert(defaultGuard.reason === "not-requested", "default guard should report not-requested");
  count += 1;

  const productionGuard = readOnlyCaptureGuard({ [readOnlyCaptureSpikeFlag]: "1" }, "production");
  assert(productionGuard.enabled === false, "read-only capture flag must be blocked outside development");
  assert(productionGuard.reason === "non-dev-build", "production guard should report non-dev-build");
  count += 1;

  const devGuard = readOnlyCaptureGuard({ [readOnlyCaptureSpikeFlag]: "true" }, "development");
  assert(devGuard.enabled === true, "read-only capture spike may only be enabled in development");
  assert(devGuard.reason === "dev-spike-enabled", "development guard should report dev-spike-enabled");
  count += 1;

  return count;
}
