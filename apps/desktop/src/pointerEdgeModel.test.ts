import { cloneDefaultLayoutProfile, type LayoutProfile } from "./layoutModel";
import { defaultEdgeDetectionConfig, detectPointerEdgeCrossing, type EdgeDetectionResult } from "./pointerEdgeModel";

type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [
  {
    name: "controller right edge selects trusted follower target",
    run: () => {
      const profile = trustedPiProfile();
      const result = detectPointerEdgeCrossing(profile, { x: 2558, y: 720 }, { x: 2562, y: 720 }, "main-display");
      assertEqual(result.type, "target");
      assertTarget(result);
      assertEqual(result.edgeId, "main-to-pi");
      assertEqual(result.targetDeviceId, "raspberry-pi");
      assertEqual(result.targetMonitorId, "pi-display");
      assertEqual(result.targetEntryPoint.x, 2560 + defaultEdgeDetectionConfig.hysteresisPx);
      assert(result.targetEntryPoint.y > 220 && result.targetEntryPoint.y < 1300, "entry y should be mapped inside the target monitor");
    }
  },
  {
    name: "inside and beyond-threshold movement stays local",
    run: () => {
      const profile = trustedPiProfile();
      assertEqual(detectPointerEdgeCrossing(profile, { x: 200, y: 300 }, { x: 500, y: 300 }, "main-display").type, "local");
      const farOutside = detectPointerEdgeCrossing(profile, { x: 2558, y: 720 }, { x: 2580, y: 720 }, "main-display");
      assertEqual(farOutside.type, "local");
      if (farOutside.type === "local") assertEqual(farOutside.reason, "outside-threshold");
    }
  },
  {
    name: "untrusted or blocked follower does not become active target",
    run: () => {
      const profile = cloneDefaultLayoutProfile();
      profile.devices[1].availability = "available";
      profile.devices[1].pairingState = "unpaired";
      const unpaired = detectPointerEdgeCrossing(profile, { x: 2558, y: 720 }, { x: 2562, y: 720 }, "main-display");
      assertBlocked(unpaired, "untrusted-target");

      profile.devices[1].pairingState = "blocked";
      const blocked = detectPointerEdgeCrossing(profile, { x: 2558, y: 720 }, { x: 2562, y: 720 }, "main-display");
      assertBlocked(blocked, "blocked-target");
    }
  },
  {
    name: "follower-to-controller edge is blocked by controller target gate",
    run: () => {
      const profile = trustedPiProfile();
      profile.edges.push({
        id: "pi-to-main",
        fromMonitorId: "pi-display",
        toMonitorId: "main-display",
        fromSide: "left",
        toSide: "right"
      });
      const result = detectPointerEdgeCrossing(profile, { x: 2562, y: 720 }, { x: 2558, y: 720 }, "pi-display");
      assertBlocked(result, "controller-target");
    }
  },
  {
    name: "hysteresis prevents repeated edge activation from an already outside pointer",
    run: () => {
      const profile = trustedPiProfile();
      const result = detectPointerEdgeCrossing(profile, { x: 2574, y: 720 }, { x: 2562, y: 720 }, "main-display");
      assertEqual(result.type, "local");
      if (result.type === "local") assertEqual(result.reason, "hysteresis");
    }
  }
];

export function runPointerEdgeModelTests() {
  for (const test of tests) {
    test.run();
  }
  return tests.length;
}

function trustedPiProfile(): LayoutProfile {
  const profile = cloneDefaultLayoutProfile();
  profile.devices[1].availability = "available";
  profile.devices[1].pairingState = "trusted";
  return profile;
}

function assertTarget(result: EdgeDetectionResult): asserts result is Extract<EdgeDetectionResult, { type: "target" }> {
  assertEqual(result.type, "target");
}

function assertBlocked(result: EdgeDetectionResult, reason: string) {
  assertEqual(result.type, "blocked");
  if (result.type === "blocked") {
    assertEqual(result.reason, reason);
    assert(result.targetDeviceId !== null, "blocked result should keep the rejected target id when known");
  }
}

function assertEqual<T>(actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}
