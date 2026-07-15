import { findDevice, type LayoutProfile, type OnstellDevice } from "./layoutModel";

export type RoutingState = "local" | "armed" | "forwarding" | "paused" | "releasing" | "blocked" | "error";

export type RoutingReleaseReason = "disconnect" | "emergency-release" | "permission-lost" | "target-change" | "trust-lost";

export type RoutingBlockReason =
  | "controller-target"
  | "local-target"
  | "offline-target"
  | "blocked-target"
  | "untrusted-target"
  | "pending-target"
  | "unknown-target"
  | "missing-target"
  | "permissions-missing";

export type RoutingSnapshot = {
  state: RoutingState;
  activeTargetDeviceId: string | null;
  activeMonitorId: string | null;
  pendingTargetDeviceId: string | null;
  heldKeys: string[];
  heldPointerButtons: string[];
  releaseRequired: boolean;
  reason: RoutingReleaseReason | RoutingBlockReason | string | null;
  lastEvent: RoutingEvent["type"] | null;
};

export type RoutingEvent =
  | { type: "arm"; targetDeviceId: string; monitorId: string | null }
  | { type: "edge-crossed"; targetDeviceId: string; monitorId: string | null }
  | { type: "target-changed"; targetDeviceId: string; monitorId: string | null }
  | { type: "pause"; reason: string }
  | { type: "resume" }
  | { type: "held-key-down"; code: string }
  | { type: "held-key-up"; code: string }
  | { type: "held-pointer-down"; button: string }
  | { type: "held-pointer-up"; button: string }
  | { type: "disconnect" }
  | { type: "permission-lost" }
  | { type: "trust-changed" }
  | { type: "emergency-release" }
  | { type: "release-complete" }
  | { type: "error"; reason: string };

export type TargetGate =
  | { ok: true; device: OnstellDevice }
  | { ok: false; reason: RoutingBlockReason };

export function createRoutingSnapshot(): RoutingSnapshot {
  return {
    state: "local",
    activeTargetDeviceId: null,
    activeMonitorId: null,
    pendingTargetDeviceId: null,
    heldKeys: [],
    heldPointerButtons: [],
    releaseRequired: false,
    reason: null,
    lastEvent: null
  };
}

export function transitionRouting(snapshot: RoutingSnapshot, event: RoutingEvent, profile: LayoutProfile): RoutingSnapshot {
  const current = cloneRoutingSnapshot(snapshot);
  const withEvent = (next: RoutingSnapshot): RoutingSnapshot => ({ ...next, lastEvent: event.type });

  switch (event.type) {
    case "arm":
      return withEvent(armTarget(current, profile, event.targetDeviceId, event.monitorId));
    case "edge-crossed":
      return withEvent(startForwarding(current, profile, event.targetDeviceId, event.monitorId));
    case "target-changed":
      return withEvent(startRelease(current, "target-change", event.targetDeviceId));
    case "pause":
      return withEvent({ ...current, state: "paused", reason: event.reason });
    case "resume":
      return withEvent(current.activeTargetDeviceId ? { ...current, state: "armed", reason: null } : toLocal(current));
    case "held-key-down":
      return withEvent({ ...current, heldKeys: addUnique(current.heldKeys, event.code) });
    case "held-key-up":
      return withEvent({ ...current, heldKeys: current.heldKeys.filter((code) => code !== event.code) });
    case "held-pointer-down":
      return withEvent({ ...current, heldPointerButtons: addUnique(current.heldPointerButtons, event.button) });
    case "held-pointer-up":
      return withEvent({ ...current, heldPointerButtons: current.heldPointerButtons.filter((button) => button !== event.button) });
    case "disconnect":
      return withEvent(startRelease(current, "disconnect"));
    case "permission-lost":
      return withEvent(startRelease(current, "permission-lost"));
    case "trust-changed":
      return withEvent(handleTrustChanged(current, profile));
    case "emergency-release":
      return withEvent(startRelease(current, "emergency-release"));
    case "release-complete":
      return withEvent(toLocal(current));
    case "error":
      return withEvent({
        ...current,
        state: "error",
        reason: event.reason,
        releaseRequired: current.heldKeys.length > 0 || current.heldPointerButtons.length > 0
      });
  }
}

export function canForwardToDevice(device: OnstellDevice | null): TargetGate {
  if (!device) return { ok: false, reason: "missing-target" };
  if (device.role === "controller") return { ok: false, reason: "controller-target" };
  if (device.availability === "local") return { ok: false, reason: "local-target" };
  if (device.availability === "blocked" || device.pairingState === "blocked") return { ok: false, reason: "blocked-target" };
  if (device.availability === "offline") return { ok: false, reason: "offline-target" };
  if (device.availability === "unknown") return { ok: false, reason: "unknown-target" };
  if (device.pairingState === "pending") return { ok: false, reason: "pending-target" };
  if (device.pairingState !== "trusted") return { ok: false, reason: "untrusted-target" };
  return { ok: true, device };
}

export function isForwarding(snapshot: RoutingSnapshot) {
  return snapshot.state === "forwarding";
}

export function needsRelease(snapshot: RoutingSnapshot) {
  return snapshot.releaseRequired || snapshot.heldKeys.length > 0 || snapshot.heldPointerButtons.length > 0;
}

function armTarget(snapshot: RoutingSnapshot, profile: LayoutProfile, targetDeviceId: string, monitorId: string | null): RoutingSnapshot {
  const gate = canForwardToDevice(findDevice(profile, targetDeviceId));
  if (!gate.ok) return block(snapshot, gate.reason);
  return {
    ...snapshot,
    state: "armed",
    activeTargetDeviceId: gate.device.id,
    activeMonitorId: monitorId,
    pendingTargetDeviceId: null,
    releaseRequired: false,
    reason: null
  };
}

function startForwarding(snapshot: RoutingSnapshot, profile: LayoutProfile, targetDeviceId: string, monitorId: string | null): RoutingSnapshot {
  const gate = canForwardToDevice(findDevice(profile, targetDeviceId));
  if (!gate.ok) return block(snapshot, gate.reason);
  return {
    ...snapshot,
    state: "forwarding",
    activeTargetDeviceId: gate.device.id,
    activeMonitorId: monitorId,
    pendingTargetDeviceId: null,
    releaseRequired: false,
    reason: null
  };
}

function handleTrustChanged(snapshot: RoutingSnapshot, profile: LayoutProfile): RoutingSnapshot {
  if (!snapshot.activeTargetDeviceId) return toLocal(snapshot);
  const gate = canForwardToDevice(findDevice(profile, snapshot.activeTargetDeviceId));
  return gate.ok ? snapshot : startRelease(snapshot, "trust-lost");
}

function block(snapshot: RoutingSnapshot, reason: RoutingBlockReason): RoutingSnapshot {
  return {
    ...snapshot,
    state: "blocked",
    activeTargetDeviceId: null,
    activeMonitorId: null,
    pendingTargetDeviceId: null,
    releaseRequired: needsRelease(snapshot),
    reason
  };
}

function startRelease(snapshot: RoutingSnapshot, reason: RoutingReleaseReason, pendingTargetDeviceId: string | null = null): RoutingSnapshot {
  return {
    ...snapshot,
    state: "releasing",
    activeTargetDeviceId: null,
    activeMonitorId: null,
    pendingTargetDeviceId,
    heldKeys: [],
    heldPointerButtons: [],
    releaseRequired: true,
    reason
  };
}

function toLocal(snapshot: RoutingSnapshot): RoutingSnapshot {
  return {
    ...snapshot,
    state: "local",
    activeTargetDeviceId: null,
    activeMonitorId: null,
    pendingTargetDeviceId: null,
    heldKeys: [],
    heldPointerButtons: [],
    releaseRequired: false,
    reason: null
  };
}

function cloneRoutingSnapshot(snapshot: RoutingSnapshot): RoutingSnapshot {
  return {
    ...snapshot,
    heldKeys: [...snapshot.heldKeys],
    heldPointerButtons: [...snapshot.heldPointerButtons]
  };
}

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}
