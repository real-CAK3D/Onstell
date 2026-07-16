import { findDevice, type LayoutProfile } from "./layoutModel";
import { canForwardToDevice, type RoutingBlockReason, type RoutingReleaseReason } from "./routingModel";

export type LoopbackFollowerEvent =
  | { type: "connect"; targetDeviceId: string; monitorId: string | null }
  | { type: "target-change"; targetDeviceId: string; monitorId: string | null }
  | { type: "pointer-move"; deltaX: number; deltaY: number }
  | { type: "pointer-down"; button: string }
  | { type: "pointer-up"; button: string }
  | { type: "key-down"; code: string }
  | { type: "key-up"; code: string }
  | { type: "release"; reason: RoutingReleaseReason | "manual-loopback-release" };

export type LoopbackFollowerSnapshot = {
  fakeOnly: true;
  connected: boolean;
  activeTargetDeviceId: string | null;
  activeMonitorId: string | null;
  heldKeys: string[];
  heldPointerButtons: string[];
  receivedEvents: number;
  releasedEvents: number;
  blockedReason: RoutingBlockReason | null;
  lastEvent: LoopbackFollowerEvent["type"] | null;
  lastMessage: string;
};

export function createLoopbackFollowerSnapshot(): LoopbackFollowerSnapshot {
  return {
    fakeOnly: true,
    connected: false,
    activeTargetDeviceId: null,
    activeMonitorId: null,
    heldKeys: [],
    heldPointerButtons: [],
    receivedEvents: 0,
    releasedEvents: 0,
    blockedReason: null,
    lastEvent: null,
    lastMessage: "Loopback follower idle"
  };
}

export function dispatchLoopbackFollowerEvent(
  snapshot: LoopbackFollowerSnapshot,
  event: LoopbackFollowerEvent,
  profile: LayoutProfile
): LoopbackFollowerSnapshot {
  const current = cloneLoopbackFollowerSnapshot(snapshot);
  const withEvent = (next: LoopbackFollowerSnapshot): LoopbackFollowerSnapshot => ({
    ...next,
    lastEvent: event.type
  });

  switch (event.type) {
    case "connect":
    case "target-change":
      return withEvent(connectToTarget(current, event.targetDeviceId, event.monitorId, profile, event.type));
    case "pointer-move":
      if (!current.connected) return withEvent(ignored(current, "Pointer move ignored while loopback is disconnected"));
      return withEvent(received(current, `Pointer delta ${event.deltaX}, ${event.deltaY}`));
    case "pointer-down":
      if (!current.connected) return withEvent(ignored(current, "Pointer button ignored while loopback is disconnected"));
      return withEvent({
        ...received(current, `Pointer ${event.button} down`),
        heldPointerButtons: addUnique(current.heldPointerButtons, event.button)
      });
    case "pointer-up":
      if (!current.connected) return withEvent(ignored(current, "Pointer button ignored while loopback is disconnected"));
      return withEvent({
        ...received(current, `Pointer ${event.button} up`),
        heldPointerButtons: current.heldPointerButtons.filter((button) => button !== event.button)
      });
    case "key-down":
      if (!current.connected) return withEvent(ignored(current, "Key ignored while loopback is disconnected"));
      return withEvent({
        ...received(current, `${event.code} down`),
        heldKeys: addUnique(current.heldKeys, event.code)
      });
    case "key-up":
      if (!current.connected) return withEvent(ignored(current, "Key ignored while loopback is disconnected"));
      return withEvent({
        ...received(current, `${event.code} up`),
        heldKeys: current.heldKeys.filter((code) => code !== event.code)
      });
    case "release":
      return withEvent({
        ...current,
        connected: false,
        activeTargetDeviceId: null,
        activeMonitorId: null,
        heldKeys: [],
        heldPointerButtons: [],
        releasedEvents: current.releasedEvents + 1,
        blockedReason: null,
        lastMessage: `Released loopback input: ${event.reason}`
      });
  }
}

function connectToTarget(
  snapshot: LoopbackFollowerSnapshot,
  targetDeviceId: string,
  monitorId: string | null,
  profile: LayoutProfile,
  eventType: "connect" | "target-change"
): LoopbackFollowerSnapshot {
  const gate = canForwardToDevice(findDevice(profile, targetDeviceId));

  if (!gate.ok) {
    return {
      ...snapshot,
      connected: false,
      activeTargetDeviceId: null,
      activeMonitorId: null,
      heldKeys: [],
      heldPointerButtons: [],
      blockedReason: gate.reason,
      lastMessage: `Loopback blocked: ${gate.reason}`
    };
  }

  return {
    ...snapshot,
    connected: true,
    activeTargetDeviceId: gate.device.id,
    activeMonitorId: monitorId,
    heldKeys: [],
    heldPointerButtons: [],
    receivedEvents: snapshot.receivedEvents + 1,
    blockedReason: null,
    lastMessage: eventType === "target-change" ? `Loopback target changed to ${gate.device.name}` : `Loopback connected to ${gate.device.name}`
  };
}

function received(snapshot: LoopbackFollowerSnapshot, lastMessage: string): LoopbackFollowerSnapshot {
  return {
    ...snapshot,
    receivedEvents: snapshot.receivedEvents + 1,
    blockedReason: null,
    lastMessage
  };
}

function ignored(snapshot: LoopbackFollowerSnapshot, lastMessage: string): LoopbackFollowerSnapshot {
  return {
    ...snapshot,
    lastMessage
  };
}

function cloneLoopbackFollowerSnapshot(snapshot: LoopbackFollowerSnapshot): LoopbackFollowerSnapshot {
  return {
    ...snapshot,
    heldKeys: [...snapshot.heldKeys],
    heldPointerButtons: [...snapshot.heldPointerButtons]
  };
}

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}
