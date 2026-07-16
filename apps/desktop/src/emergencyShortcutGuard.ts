export const emergencyShortcutSpikeFlag = "VITE_ONSTELL_GLOBAL_RELEASE_SHORTCUT_SPIKE";

export type EmergencyShortcutPlatform = "windows" | "macos" | "linux" | "unknown";

export type EmergencyShortcutGuardReason = "not-requested" | "non-dev-build" | "dev-spike-enabled";

export type EmergencyShortcutRegistrationStatus = "not-registered" | "prototype-allowed";

export type EmergencyShortcutGuard = {
  requested: boolean;
  enabled: boolean;
  reason: EmergencyShortcutGuardReason;
  status: EmergencyShortcutRegistrationStatus;
  accelerator: string;
  strategy: string;
  fallback: string;
  warning: string;
};

type ShortcutEnv = Record<string, boolean | string | undefined>;

export function emergencyShortcutGuard(
  env: ShortcutEnv,
  mode: string,
  platform: EmergencyShortcutPlatform
): EmergencyShortcutGuard {
  const requested = env[emergencyShortcutSpikeFlag] === "1" || env[emergencyShortcutSpikeFlag] === "true";
  const base = shortcutPlanForPlatform(platform);

  if (!requested) {
    return {
      ...base,
      requested: false,
      enabled: false,
      reason: "not-requested",
      status: "not-registered",
      warning: "Global emergency release shortcut registration is off unless a developer explicitly enables the spike flag."
    };
  }

  if (mode !== "development") {
    return {
      ...base,
      requested: true,
      enabled: false,
      reason: "non-dev-build",
      status: "not-registered",
      warning: "Global emergency release shortcut spike flags are ignored outside development builds."
    };
  }

  return {
    ...base,
    requested: true,
    enabled: true,
    reason: "dev-spike-enabled",
    status: "prototype-allowed",
    warning: "A future development prototype may try to register the shortcut, but Release Input UI and tray actions remain the reliable fallback."
  };
}

export function shortcutPlanForPlatform(platform: EmergencyShortcutPlatform) {
  const commonFallback = "If registration fails or is unavailable, keep the widget Release Input button and tray Release Input command active.";

  switch (platform) {
    case "macos":
      return {
        accelerator: "Control+Option+Escape",
        strategy: "Use a Tauri global-shortcut prototype only after Accessibility/Input Monitoring readiness is shown and the dev spike flag is enabled.",
        fallback: commonFallback
      };
    case "windows":
      return {
        accelerator: "Ctrl+Alt+Escape",
        strategy: "Use a Tauri global-shortcut prototype only after the read-only capture path and release-all behavior are tested in development.",
        fallback: commonFallback
      };
    case "linux":
      return {
        accelerator: "Ctrl+Alt+Escape",
        strategy: "Use a Tauri global-shortcut prototype where the desktop environment permits it; Wayland or compositor limitations must leave the UI/tray fallback in place.",
        fallback: commonFallback
      };
    case "unknown":
      return {
        accelerator: "Ctrl+Alt+Escape",
        strategy: "Do not attempt registration until the platform is identified and a development-only prototype is explicitly enabled.",
        fallback: commonFallback
      };
  }
}
