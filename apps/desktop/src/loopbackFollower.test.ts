import { cloneDefaultLayoutProfile, type LayoutProfile } from "./layoutModel";
import {
  createLoopbackFollowerSnapshot,
  dispatchLoopbackFollowerEvent,
  type LoopbackFollowerSnapshot
} from "./loopbackFollower";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runLoopbackFollowerTests() {
  let count = 0;

  const trusted = trustedProfile();
  let loopback = dispatchLoopbackFollowerEvent(
    createLoopbackFollowerSnapshot(),
    { type: "connect", targetDeviceId: "raspberry-pi", monitorId: "pi-display" },
    trusted
  );
  assert(loopback.connected, "trusted available follower should connect");
  loopback = dispatchLoopbackFollowerEvent(loopback, { type: "key-down", code: "KeyA" }, trusted);
  loopback = dispatchLoopbackFollowerEvent(loopback, { type: "pointer-down", button: "left" }, trusted);
  loopback = dispatchLoopbackFollowerEvent(loopback, { type: "pointer-move", deltaX: 24, deltaY: -8 }, trusted);
  assertIncludes(loopback.heldKeys, "KeyA", "loopback should track fake held key state");
  assertIncludes(loopback.heldPointerButtons, "left", "loopback should track fake held pointer state");
  assert(loopback.receivedEvents === 4, "loopback should count simulated events");
  count += 1;

  loopback = dispatchLoopbackFollowerEvent(loopback, { type: "release", reason: "emergency-release" }, trusted);
  assertReleased(loopback);
  count += 1;

  const untrusted = cloneDefaultLayoutProfile();
  const blocked = dispatchLoopbackFollowerEvent(
    createLoopbackFollowerSnapshot(),
    { type: "connect", targetDeviceId: "raspberry-pi", monitorId: "pi-display" },
    untrusted
  );
  assert(!blocked.connected, "untrusted follower should not connect");
  assert(blocked.blockedReason === "unknown-target", "default placeholder follower should stay gated");
  count += 1;

  const targetChanged = dispatchLoopbackFollowerEvent(
    dispatchLoopbackFollowerEvent(createLoopbackFollowerSnapshot(), { type: "connect", targetDeviceId: "raspberry-pi", monitorId: "pi-display" }, trusted),
    { type: "target-change", targetDeviceId: "hp-laptop", monitorId: "hp-internal" },
    trustedWithSecondFollower()
  );
  assert(targetChanged.connected, "trusted target change should keep loopback connected");
  assert(targetChanged.activeTargetDeviceId === "hp-laptop", "target change should update active target");
  assert(targetChanged.heldKeys.length === 0, "target change should clear held keys");
  count += 1;

  return count;
}

function trustedProfile(): LayoutProfile {
  const profile = cloneDefaultLayoutProfile();
  profile.devices[1].availability = "available";
  profile.devices[1].pairingState = "trusted";
  return profile;
}

function trustedWithSecondFollower(): LayoutProfile {
  const profile = trustedProfile();
  profile.devices[2].availability = "available";
  profile.devices[2].pairingState = "trusted";
  return profile;
}

function assertReleased(loopback: LoopbackFollowerSnapshot) {
  assert(!loopback.connected, "release should disconnect loopback");
  assert(loopback.heldKeys.length === 0, "release should clear held keys");
  assert(loopback.heldPointerButtons.length === 0, "release should clear held pointer buttons");
  assert(loopback.releasedEvents === 1, "release should increment released event count");
}

function assertIncludes(values: string[], expected: string, message: string) {
  assert(values.includes(expected), message);
}
