export type DeviceRole = "controller" | "follower";

export type DeviceAvailability = "local" | "available" | "offline" | "blocked" | "unknown";

export type PairingState = "local" | "unpaired" | "pending" | "trusted" | "blocked";

export type MonitorRole = "primary" | "secondary" | "virtual";

export type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OnstellMonitor = {
  id: string;
  name: string;
  role: MonitorRole;
  rect: LayoutRect;
  scale: number;
  color: string;
};

export type OnstellDevice = {
  id: string;
  name: string;
  role: DeviceRole;
  availability: DeviceAvailability;
  pairingState: PairingState;
  lastSeen: string | null;
  monitors: OnstellMonitor[];
};

export type LayoutEdge = {
  id: string;
  fromMonitorId: string;
  toMonitorId: string;
  fromSide: "left" | "right" | "top" | "bottom";
  toSide: "left" | "right" | "top" | "bottom";
};

export type LayoutProfile = {
  id: string;
  name: string;
  activeDeviceId: string;
  activeMonitorId: string;
  devices: OnstellDevice[];
  edges: LayoutEdge[];
  updatedAt: string;
};

export const defaultLayoutProfile: LayoutProfile = {
  id: "desk-laptop-closed",
  name: "Desk - Laptop Closed",
  activeDeviceId: "main-pc",
  activeMonitorId: "main-display",
  updatedAt: "2026-07-15T00:00:00.000Z",
  devices: [
    {
      id: "main-pc",
      name: "Main PC",
      role: "controller",
      availability: "local",
      pairingState: "local",
      lastSeen: null,
      monitors: [
        {
          id: "main-display",
          name: "Display 1",
          role: "primary",
          rect: { x: 0, y: 0, width: 2560, height: 1440 },
          scale: 1,
          color: "#9b6cff"
        }
      ]
    },
    {
      id: "raspberry-pi",
      name: "Raspberry Pi",
      role: "follower",
      availability: "unknown",
      pairingState: "unpaired",
      lastSeen: null,
      monitors: [
        {
          id: "pi-display",
          name: "Display 2",
          role: "secondary",
          rect: { x: 2560, y: 220, width: 1920, height: 1080 },
          scale: 1,
          color: "#35d6ff"
        }
      ]
    },
    {
      id: "hp-laptop",
      name: "HP Laptop",
      role: "follower",
      availability: "offline",
      pairingState: "trusted",
      lastSeen: null,
      monitors: [
        {
          id: "hp-internal",
          name: "Internal display",
          role: "secondary",
          rect: { x: -1920, y: 120, width: 1920, height: 1200 },
          scale: 1.25,
          color: "#ffd166"
        }
      ]
    }
  ],
  edges: [
    {
      id: "main-to-pi",
      fromMonitorId: "main-display",
      toMonitorId: "pi-display",
      fromSide: "right",
      toSide: "left"
    },
    {
      id: "main-to-hp",
      fromMonitorId: "main-display",
      toMonitorId: "hp-internal",
      fromSide: "left",
      toSide: "right"
    }
  ]
};

export function findDevice(profile: LayoutProfile, deviceId: string) {
  return profile.devices.find((device) => device.id === deviceId) ?? null;
}

export function findMonitor(profile: LayoutProfile, monitorId: string) {
  for (const device of profile.devices) {
    const monitor = device.monitors.find((candidate) => candidate.id === monitorId);
    if (monitor) return { device, monitor };
  }
  return null;
}

export function availabilityLabel(availability: DeviceAvailability) {
  const labels: Record<DeviceAvailability, string> = {
    local: "Local",
    available: "Available",
    offline: "Offline",
    blocked: "Blocked",
    unknown: "Placeholder"
  };
  return labels[availability];
}

export function pairingLabel(pairingState: PairingState) {
  const labels: Record<PairingState, string> = {
    local: "Local",
    unpaired: "Unpaired",
    pending: "Pending",
    trusted: "Trusted",
    blocked: "Blocked"
  };
  return labels[pairingState];
}

export function cloneDefaultLayoutProfile(): LayoutProfile {
  return JSON.parse(JSON.stringify(defaultLayoutProfile)) as LayoutProfile;
}
