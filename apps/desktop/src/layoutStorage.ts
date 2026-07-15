import {
  cloneDefaultLayoutProfile,
  defaultLayoutProfile,
  type LayoutProfile,
  type OnstellDevice,
  type OnstellMonitor
} from "./layoutModel";

const layoutProfileKey = "onstell.layout.profile";

export function loadLayoutProfile(): LayoutProfile {
  const stored = window.localStorage.getItem(layoutProfileKey);
  if (!stored) return cloneDefaultLayoutProfile();

  try {
    return normalizeLayoutProfile(JSON.parse(stored));
  } catch {
    window.localStorage.removeItem(layoutProfileKey);
    return cloneDefaultLayoutProfile();
  }
}

export function saveLayoutProfile(profile: LayoutProfile) {
  const next: LayoutProfile = {
    ...profile,
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(layoutProfileKey, JSON.stringify(next));
}

function normalizeLayoutProfile(value: unknown): LayoutProfile {
  if (!isRecord(value)) return cloneDefaultLayoutProfile();

  const fallback = defaultLayoutProfile;
  const devices = Array.isArray(value.devices)
    ? value.devices.map(normalizeDevice).filter((device): device is OnstellDevice => device !== null)
    : cloneDefaultLayoutProfile().devices;

  if (devices.length === 0) devices.push(...cloneDefaultLayoutProfile().devices);

  const activeDeviceId = stringOr(value.activeDeviceId, devices[0].id);
  const activeDevice = devices.find((device) => device.id === activeDeviceId) ?? devices[0];
  const firstMonitor = activeDevice.monitors[0] ?? devices.flatMap((device) => device.monitors)[0];

  return {
    id: stringOr(value.id, fallback.id),
    name: stringOr(value.name, fallback.name),
    activeDeviceId: activeDevice.id,
    activeMonitorId: stringOr(value.activeMonitorId, firstMonitor?.id ?? fallback.activeMonitorId),
    devices,
    edges: Array.isArray(value.edges) ? value.edges.filter(isRecord).map((edge, index) => ({
      id: stringOr(edge.id, `edge-${index + 1}`),
      fromMonitorId: stringOr(edge.fromMonitorId, ""),
      toMonitorId: stringOr(edge.toMonitorId, ""),
      fromSide: sideOr(edge.fromSide, "right"),
      toSide: sideOr(edge.toSide, "left")
    })) : fallback.edges,
    updatedAt: stringOr(value.updatedAt, new Date().toISOString())
  };
}

function normalizeDevice(value: unknown): OnstellDevice | null {
  if (!isRecord(value)) return null;
  const monitors = Array.isArray(value.monitors)
    ? value.monitors.map(normalizeMonitor).filter((monitor): monitor is OnstellMonitor => monitor !== null)
    : [];

  if (monitors.length === 0) return null;

  return {
    id: stringOr(value.id, `device-${crypto.randomUUID()}`),
    name: stringOr(value.name, "Unnamed device"),
    role: value.role === "controller" ? "controller" : "follower",
    availability: availabilityOr(value.availability),
    pairingState: pairingStateOr(value.pairingState, value.role === "controller" ? "local" : "unpaired"),
    lastSeen: typeof value.lastSeen === "string" ? value.lastSeen : null,
    monitors
  };
}

function normalizeMonitor(value: unknown): OnstellMonitor | null {
  if (!isRecord(value)) return null;
  const rect = isRecord(value.rect) ? value.rect : {};

  return {
    id: stringOr(value.id, `monitor-${crypto.randomUUID()}`),
    name: stringOr(value.name, "Display"),
    role: value.role === "primary" || value.role === "virtual" ? value.role : "secondary",
    rect: {
      x: numberOr(rect.x, 0),
      y: numberOr(rect.y, 0),
      width: Math.max(1, numberOr(rect.width, 1920)),
      height: Math.max(1, numberOr(rect.height, 1080))
    },
    scale: Math.max(0.5, numberOr(value.scale, 1)),
    color: stringOr(value.color, "#9b6cff")
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function availabilityOr(value: unknown): OnstellDevice["availability"] {
  if (value === "local" || value === "available" || value === "offline" || value === "blocked" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function pairingStateOr(value: unknown, fallback: OnstellDevice["pairingState"]): OnstellDevice["pairingState"] {
  if (value === "local" || value === "unpaired" || value === "pending" || value === "trusted" || value === "blocked") {
    return value;
  }
  return fallback;
}

function sideOr(value: unknown, fallback: "left" | "right" | "top" | "bottom") {
  if (value === "left" || value === "right" || value === "top" || value === "bottom") return value;
  return fallback;
}
