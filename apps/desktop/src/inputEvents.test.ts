import {
  applyInputEventToHeldState,
  createFakeInputCaptureAdapter,
  createReleaseAllInputEvent,
  emptyModifiers,
  noInputAdapterCapabilities,
  sanitizeInputEventForLog,
  type HeldInputState,
  type KeyboardInputEvent,
  type NormalizedInputEvent
} from "./inputEvents";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runInputEventTests() {
  let count = 0;

  const adapter = createFakeInputCaptureAdapter();
  assert(adapter.source === "fake", "default adapter must be fake");
  assert(adapter.capabilities.readGlobalInput === false, "fake adapter must not read global input");
  assert(adapter.capabilities.suppressLocalInput === false, "input adapters must not suppress local input");
  assert(adapter.capabilities.injectInput === false, "input adapters must not inject input");
  assert(adapter.capabilities.readClipboard === false, "input adapters must not read clipboard");
  assert(adapter.capabilities.networkTransport === false, "input adapters must not use network transport");
  assert(noInputAdapterCapabilities.injectInput === false, "default capabilities must be non-injecting");
  count += 1;

  const keyDown: KeyboardInputEvent = {
    type: "keyboard",
    phase: "down",
    source: "fake",
    timestampMs: 105,
    targetMonitorId: "pi-display",
    code: "KeyA",
    modifiers: { ...emptyModifiers, shift: true }
  };
  adapter.queueFakeEvent(keyDown);
  adapter.queueFakeEvent(createReleaseAllInputEvent("emergency-release", "fake", 114));
  const events = adapter.readQueuedEvents();
  assert(events.length === 2, "fake adapter should return queued events");
  assert(adapter.readQueuedEvents().length === 0, "reading queued events should drain the fake queue");
  count += 1;

  let held: HeldInputState = { heldKeys: [], heldPointerButtons: [] };
  held = applyInputEventToHeldState(held, keyDown);
  held = applyInputEventToHeldState(held, pointerButton("down"));
  assert(held.heldKeys.includes("KeyA"), "held state should track keyboard down events");
  assert(held.heldPointerButtons.includes("left"), "held state should track pointer down events");
  held = applyInputEventToHeldState(held, createReleaseAllInputEvent("emergency-release", "fake"));
  assert(held.heldKeys.length === 0, "release-all should clear held keys");
  assert(held.heldPointerButtons.length === 0, "release-all should clear held pointer buttons");
  count += 1;

  const sanitized = sanitizeInputEventForLog(keyDown);
  assert("code" in sanitized, "sanitized keyboard logs may include physical code");
  assert(!("text" in sanitized), "sanitized keyboard logs must not include text");
  assert(sanitized.timestampMs === 110, "sanitized timestamps should be rounded to 10 ms");
  count += 1;

  return count;
}

function pointerButton(phase: "down" | "up"): NormalizedInputEvent {
  return {
    type: "pointer-button",
    phase,
    source: "fake",
    timestampMs: 120,
    targetMonitorId: "pi-display",
    button: "left"
  };
}
