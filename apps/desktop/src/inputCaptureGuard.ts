export const readOnlyCaptureSpikeFlag = "VITE_ONSTELL_READONLY_CAPTURE_SPIKE";

export type InputCaptureGuardReason = "not-requested" | "non-dev-build" | "dev-spike-enabled";

export type InputCaptureGuard = {
  requested: boolean;
  enabled: boolean;
  reason: InputCaptureGuardReason;
  label: string;
  warning: string;
};

type CaptureEnv = Record<string, boolean | string | undefined>;

export function readOnlyCaptureGuard(
  env: CaptureEnv,
  mode: string
): InputCaptureGuard {
  const requested = env[readOnlyCaptureSpikeFlag] === "1" || env[readOnlyCaptureSpikeFlag] === "true";

  if (!requested) {
    return {
      requested: false,
      enabled: false,
      reason: "not-requested",
      label: "Dev spike disabled",
      warning: "Read-only input capture is off unless a developer explicitly enables the spike flag."
    };
  }

  if (mode !== "development") {
    return {
      requested: true,
      enabled: false,
      reason: "non-dev-build",
      label: "Capture blocked",
      warning: "Read-only input capture spike flags are ignored outside development builds."
    };
  }

  return {
    requested: true,
    enabled: true,
    reason: "dev-spike-enabled",
    label: "Dev read-only spike",
    warning: "Only sanitized event metadata may be observed; suppression, injection, forwarding, payload logging, and persistence are still forbidden."
  };
}
