export type OnstellPlatform = "windows" | "macos" | "linux" | "unknown";

export type PermissionCapability = "capture" | "injection";

export type PermissionStatus = "stubbed" | "unknown" | "missing" | "blocked" | "granted";

export type PermissionState = {
  capability: PermissionCapability;
  status: PermissionStatus;
  label: string;
  detail: string;
  userWarning: string;
};

export type PermissionReadiness = {
  platform: OnstellPlatform;
  promptsEnabled: false;
  capture: PermissionState;
  injection: PermissionState;
};

export type PermissionOverrides = Partial<Record<PermissionCapability, Partial<PermissionState>>>;

export function detectCurrentPlatform(userAgent = globalThis.navigator?.userAgent ?? ""): OnstellPlatform {
  const normalized = userAgent.toLowerCase();
  if (normalized.includes("windows")) return "windows";
  if (normalized.includes("mac os") || normalized.includes("macintosh")) return "macos";
  if (normalized.includes("linux")) return "linux";
  return "unknown";
}

export function createPermissionReadiness(
  platform: OnstellPlatform,
  overrides: PermissionOverrides = {}
): PermissionReadiness {
  const base = permissionTemplate(platform);
  return {
    platform,
    promptsEnabled: false,
    capture: { ...base.capture, ...overrides.capture },
    injection: { ...base.injection, ...overrides.injection }
  };
}

export function permissionSummary(state: PermissionState) {
  return `${permissionStatusLabel(state.status)} - ${state.detail}`;
}

export function permissionStatusLabel(status: PermissionStatus) {
  const labels: Record<PermissionStatus, string> = {
    stubbed: "Stubbed",
    unknown: "Unknown",
    missing: "Missing",
    blocked: "Blocked",
    granted: "Granted"
  };
  return labels[status];
}

function permissionTemplate(platform: OnstellPlatform): Omit<PermissionReadiness, "platform" | "promptsEnabled"> {
  if (platform === "windows") {
    return {
      capture: {
        capability: "capture",
        status: "unknown",
        label: "Windows capture",
        detail: "Raw Input visibility not checked",
        userWarning: "Onstell has not requested or verified Windows keyboard and pointer capture access."
      },
      injection: {
        capability: "injection",
        status: "unknown",
        label: "Windows injection",
        detail: "SendInput/UIPI compatibility not checked",
        userWarning: "Onstell has not requested or verified Windows input injection behavior."
      }
    };
  }

  if (platform === "macos") {
    return {
      capture: {
        capability: "capture",
        status: "missing",
        label: "macOS capture",
        detail: "Accessibility/Input Monitoring not requested",
        userWarning: "Onstell must show a user warning before requesting macOS Accessibility or Input Monitoring permissions."
      },
      injection: {
        capability: "injection",
        status: "missing",
        label: "macOS injection",
        detail: "Accessibility permission not requested",
        userWarning: "Onstell must not request macOS Accessibility permission until a guarded prototype needs it."
      }
    };
  }

  if (platform === "linux") {
    return {
      capture: {
        capability: "capture",
        status: "unknown",
        label: "Linux capture",
        detail: "evdev/X11/Wayland access not checked",
        userWarning: "Onstell has not checked Linux input access, group membership, udev rules, or compositor limitations."
      },
      injection: {
        capability: "injection",
        status: "unknown",
        label: "Linux injection",
        detail: "uinput access not checked",
        userWarning: "Onstell has not checked Linux uinput access and must not create virtual devices in this phase."
      }
    };
  }

  return {
    capture: {
      capability: "capture",
      status: "stubbed",
      label: "Capture permission",
      detail: "Platform not detected",
      userWarning: "Onstell cannot describe platform permissions until the platform is known."
    },
    injection: {
      capability: "injection",
      status: "stubbed",
      label: "Injection permission",
      detail: "Platform not detected",
      userWarning: "Onstell cannot describe platform injection permissions until the platform is known."
    }
  };
}
