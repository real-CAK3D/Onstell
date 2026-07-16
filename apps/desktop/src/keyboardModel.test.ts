import {
  emptyKeyboardHeldState,
  normalizeKeyboardEvent,
  sanitizeKeyboardDecisionForLog,
  type KeyboardHeldState
} from "./keyboardModel";

type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [
  {
    name: "normalizes physical key code and modifier state for forwarding",
    run: () => {
      const result = normalizeKeyboardEvent({
        phase: "down",
        source: "fake",
        timestampMs: 105,
        targetMonitorId: "pi-display",
        code: "KeyA",
        modifiers: { shift: true }
      });
      assertEqual(result.type, "forwardable");
      if (result.type === "forwardable") {
        assertEqual(result.event.code, "KeyA");
        assertEqual(result.event.modifiers.shift, true);
        assertEqual(result.event.modifiers.control, false);
        assertEqual(result.held.heldKeys.includes("KeyA"), true);
      }
    }
  },
  {
    name: "tracks held key down and up without duplicates",
    run: () => {
      let held: KeyboardHeldState = emptyKeyboardHeldState;
      const first = normalizeKeyboardEvent(key("down", "KeyA"), held);
      assertEqual(first.type, "forwardable");
      if (first.type === "forwardable") held = first.held;

      const repeat = normalizeKeyboardEvent(key("down", "KeyA"), held);
      assertEqual(repeat.type, "forwardable");
      if (repeat.type === "forwardable") held = repeat.held;
      assertEqual(held.heldKeys.length, 1);

      const release = normalizeKeyboardEvent(key("up", "KeyA"), held);
      assertEqual(release.type, "forwardable");
      if (release.type === "forwardable") held = release.held;
      assertEqual(held.heldKeys.includes("KeyA"), false);
    }
  },
  {
    name: "blocks secure attention sequence",
    run: () => {
      const result = normalizeKeyboardEvent({
        ...key("down", "Delete"),
        modifiers: { control: true, alt: true }
      });
      assertEqual(result.type, "blocked");
      if (result.type === "blocked") assertEqual(result.reason, "secure-attention");
    }
  },
  {
    name: "blocks emergency release shortcut",
    run: () => {
      const result = normalizeKeyboardEvent({
        ...key("down", "Escape"),
        modifiers: { control: true, alt: true }
      });
      assertEqual(result.type, "blocked");
      if (result.type === "blocked") assertEqual(result.reason, "emergency-release");
    }
  },
  {
    name: "sanitized keyboard decision logs contain no text payload fields",
    run: () => {
      const result = normalizeKeyboardEvent({
        phase: "down",
        source: "fake",
        timestampMs: 105,
        targetMonitorId: "pi-display",
        code: "KeyA",
        modifiers: { shift: true }
      });
      const sanitized = sanitizeKeyboardDecisionForLog(result);
      assertEqual(sanitized.timestampMs, 110);
      assertEqual("code" in sanitized, true);
      assertEqual("key" in sanitized, false);
      assertEqual("text" in sanitized, false);
      assertEqual("character" in sanitized, false);
    }
  }
];

export function runKeyboardModelTests() {
  for (const test of tests) {
    test.run();
  }
  return tests.length;
}

function key(phase: "down" | "up", code: string) {
  return {
    phase,
    source: "fake" as const,
    timestampMs: 120,
    targetMonitorId: "pi-display",
    code
  };
}

function assertEqual<T>(actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}
