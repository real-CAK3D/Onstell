import { cloneDefaultLayoutProfile, type LayoutProfile, type OnstellDevice } from "./layoutModel";
import {
  canForwardToDevice,
  createRoutingSnapshot,
  isForwarding,
  needsRelease,
  transitionRouting,
  type RoutingBlockReason,
  type RoutingSnapshot
} from "./routingModel";

type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [
  {
    name: "trusted available follower can arm and forward",
    run: () => {
      const profile = profileWithFollower({ availability: "available", pairingState: "trusted" });
      let state = createRoutingSnapshot();
      state = transitionRouting(state, { type: "arm", targetDeviceId: "target", monitorId: "target-display" }, profile);
      assertEqual(state.state, "armed");
      assertEqual(state.activeTargetDeviceId, "target");
      state = transitionRouting(state, { type: "edge-crossed", targetDeviceId: "target", monitorId: "target-display" }, profile);
      assertEqual(state.state, "forwarding");
      assertEqual(isForwarding(state), true);
    }
  },
  {
    name: "untrusted and unavailable followers cannot forward",
    run: () => {
      const blockedTargets: Array<[OnstellDevice["availability"], OnstellDevice["pairingState"], RoutingBlockReason]> = [
        ["available", "unpaired", "untrusted-target"],
        ["available", "pending", "pending-target"],
        ["available", "blocked", "blocked-target"],
        ["blocked", "trusted", "blocked-target"],
        ["offline", "trusted", "offline-target"],
        ["unknown", "trusted", "unknown-target"]
      ];

      for (const [availability, pairingState, reason] of blockedTargets) {
        const profile = profileWithFollower({ availability, pairingState });
        const state = transitionRouting(createRoutingSnapshot(), { type: "edge-crossed", targetDeviceId: "target", monitorId: null }, profile);
        assertEqual(state.state, "blocked");
        assertEqual(state.reason, reason);
        assertEqual(isForwarding(state), false);
      }
    }
  },
  {
    name: "controller cannot become a forwarding target",
    run: () => {
      const profile = cloneDefaultLayoutProfile();
      const gate = canForwardToDevice(profile.devices[0]);
      assertEqual(gate.ok, false);
      if (!gate.ok) assertEqual(gate.reason, "controller-target");
    }
  },
  {
    name: "emergency release clears held state and leaves forwarding",
    run: () => {
      const profile = profileWithFollower({ availability: "available", pairingState: "trusted" });
      let state = transitionRouting(createRoutingSnapshot(), { type: "edge-crossed", targetDeviceId: "target", monitorId: null }, profile);
      state = transitionRouting(state, { type: "held-key-down", code: "KeyA" }, profile);
      state = transitionRouting(state, { type: "held-pointer-down", button: "left" }, profile);
      state = transitionRouting(state, { type: "emergency-release" }, profile);
      assertReleaseState(state, "emergency-release");
      state = transitionRouting(state, { type: "release-complete" }, profile);
      assertEqual(state.state, "local");
      assertEqual(needsRelease(state), false);
    }
  },
  {
    name: "disconnect and permission loss require release",
    run: () => {
      const profile = profileWithFollower({ availability: "available", pairingState: "trusted" });
      const forwarding = transitionRouting(createRoutingSnapshot(), { type: "edge-crossed", targetDeviceId: "target", monitorId: null }, profile);
      assertReleaseState(transitionRouting(forwarding, { type: "disconnect" }, profile), "disconnect");
      assertReleaseState(transitionRouting(forwarding, { type: "permission-lost" }, profile), "permission-lost");
    }
  },
  {
    name: "trust loss exits forwarding",
    run: () => {
      const profile = profileWithFollower({ availability: "available", pairingState: "trusted" });
      let state = transitionRouting(createRoutingSnapshot(), { type: "edge-crossed", targetDeviceId: "target", monitorId: null }, profile);
      profile.devices[1].pairingState = "blocked";
      state = transitionRouting(state, { type: "trust-changed" }, profile);
      assertReleaseState(state, "trust-lost");
    }
  },
  {
    name: "target change releases before switching",
    run: () => {
      const profile = profileWithFollower({ availability: "available", pairingState: "trusted" });
      const forwarding = transitionRouting(createRoutingSnapshot(), { type: "edge-crossed", targetDeviceId: "target", monitorId: null }, profile);
      const state = transitionRouting(forwarding, { type: "target-changed", targetDeviceId: "other", monitorId: null }, profile);
      assertReleaseState(state, "target-change");
      assertEqual(state.pendingTargetDeviceId, "other");
    }
  }
];

export function runRoutingModelTests() {
  for (const test of tests) {
    test.run();
  }
  return tests.length;
}

function profileWithFollower(overrides: Pick<OnstellDevice, "availability" | "pairingState">): LayoutProfile {
  const profile = cloneDefaultLayoutProfile();
  profile.devices[1] = {
    ...profile.devices[1],
    id: "target",
    name: "Target Device",
    availability: overrides.availability,
    pairingState: overrides.pairingState,
    monitors: [
      {
        ...profile.devices[1].monitors[0],
        id: "target-display"
      }
    ]
  };
  return profile;
}

function assertReleaseState(state: RoutingSnapshot, reason: string) {
  assertEqual(state.state, "releasing");
  assertEqual(state.reason, reason);
  assertEqual(state.activeTargetDeviceId, null);
  assertEqual(state.heldKeys.length, 0);
  assertEqual(state.heldPointerButtons.length, 0);
  assertEqual(needsRelease(state), true);
  assertEqual(isForwarding(state), false);
}

function assertEqual<T>(actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}
