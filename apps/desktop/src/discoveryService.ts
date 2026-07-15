import type { DeviceAvailability, LayoutProfile, OnstellDevice } from "./layoutModel";

export type DiscoveredDevice = {
  id: string;
  name: string;
  availability: DeviceAvailability;
  source: "local" | "fake-lan";
  lastSeen: string | null;
  profileDeviceId: string | null;
};

export type DiscoverySnapshot = {
  running: boolean;
  scanCount: number;
  updatedAt: string | null;
  devices: DiscoveredDevice[];
};

export function createDiscoverySnapshot(profile: LayoutProfile, scanCount = 0): DiscoverySnapshot {
  return {
    running: false,
    scanCount,
    updatedAt: null,
    devices: profile.devices.map((device) => discoveredFromProfileDevice(device))
  };
}

export async function scanFakeDiscovery(profile: LayoutProfile, previous: DiscoverySnapshot): Promise<DiscoverySnapshot> {
  const scanCount = previous.scanCount + 1;
  const now = new Date().toISOString();
  const discovered = profile.devices.map((device, index) => {
    const nextAvailability = device.role === "controller"
      ? "local"
      : fakeAvailabilityFor(scanCount, index, device.availability);

    return {
      ...discoveredFromProfileDevice(device),
      availability: nextAvailability,
      lastSeen: nextAvailability === "offline" || nextAvailability === "blocked" ? device.lastSeen : now
    };
  });

  if (scanCount % 2 === 1) {
    discovered.push({
      id: "fake-lan-workshop-mini",
      name: "Workshop Mini PC",
      availability: "available",
      source: "fake-lan",
      lastSeen: now,
      profileDeviceId: profile.devices.some((device) => device.id === "workshop-mini-pc") ? "workshop-mini-pc" : null
    });
  }

  await new Promise((resolve) => window.setTimeout(resolve, 180));

  return {
    running: false,
    scanCount,
    updatedAt: now,
    devices: discovered
  };
}

export function applyDiscoveryToProfile(profile: LayoutProfile, snapshot: DiscoverySnapshot) {
  for (const discovered of snapshot.devices) {
    const existing = discovered.profileDeviceId
      ? profile.devices.find((device) => device.id === discovered.profileDeviceId)
      : profile.devices.find((device) => device.id === discovered.id);

    if (existing) {
      existing.availability = discovered.availability;
      existing.lastSeen = discovered.lastSeen;
      continue;
    }

    if (discovered.source === "fake-lan" && discovered.availability === "available") {
      profile.devices.push({
        id: "workshop-mini-pc",
        name: discovered.name,
        role: "follower",
        availability: discovered.availability,
        lastSeen: discovered.lastSeen,
        monitors: [
          {
            id: "workshop-mini-pc-display",
            name: "Display 1",
            role: "secondary",
            rect: { x: 4800, y: 320, width: 1920, height: 1080 },
            scale: 1,
            color: "#22c55e"
          }
        ]
      });
    }
  }

  profile.updatedAt = new Date().toISOString();
}

function discoveredFromProfileDevice(device: OnstellDevice): DiscoveredDevice {
  return {
    id: device.id,
    name: device.name,
    availability: device.availability,
    source: device.role === "controller" ? "local" : "fake-lan",
    lastSeen: device.lastSeen,
    profileDeviceId: device.id
  };
}

function fakeAvailabilityFor(scanCount: number, index: number, fallback: DeviceAvailability): DeviceAvailability {
  if (fallback === "blocked") return "blocked";
  if ((scanCount + index) % 4 === 0) return "offline";
  return "available";
}
