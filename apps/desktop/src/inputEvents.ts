export type InputEventSource = "fake" | "read-only-capture" | "platform-capture";

export type InputEventPhase = "down" | "up" | "move" | "scroll" | "release-all";

export type InputModifiers = {
  shift: boolean;
  control: boolean;
  alt: boolean;
  meta: boolean;
};

export type InputAdapterCapabilities = {
  readGlobalInput: boolean;
  suppressLocalInput: false;
  injectInput: false;
  readClipboard: false;
  networkTransport: false;
};

export type PointerMoveInputEvent = {
  type: "pointer-move";
  phase: "move";
  source: InputEventSource;
  timestampMs: number;
  targetMonitorId: string | null;
  deltaX: number;
  deltaY: number;
};

export type PointerButtonInputEvent = {
  type: "pointer-button";
  phase: "down" | "up";
  source: InputEventSource;
  timestampMs: number;
  targetMonitorId: string | null;
  button: "left" | "right" | "middle" | "back" | "forward";
};

export type WheelInputEvent = {
  type: "wheel";
  phase: "scroll";
  source: InputEventSource;
  timestampMs: number;
  targetMonitorId: string | null;
  deltaX: number;
  deltaY: number;
};

export type KeyboardInputEvent = {
  type: "keyboard";
  phase: "down" | "up";
  source: InputEventSource;
  timestampMs: number;
  targetMonitorId: string | null;
  code: string;
  modifiers: InputModifiers;
};

export type ReleaseAllInputEvent = {
  type: "release-all";
  phase: "release-all";
  source: InputEventSource;
  timestampMs: number;
  targetMonitorId: string | null;
  reason: "disconnect" | "emergency-release" | "permission-lost" | "target-change" | "trust-lost" | "adapter-stop";
};

export type NormalizedInputEvent =
  | PointerMoveInputEvent
  | PointerButtonInputEvent
  | WheelInputEvent
  | KeyboardInputEvent
  | ReleaseAllInputEvent;

export type HeldInputState = {
  heldKeys: string[];
  heldPointerButtons: string[];
};

export type InputCaptureAdapter = {
  id: string;
  source: InputEventSource;
  label: string;
  capabilities: InputAdapterCapabilities;
  readQueuedEvents: () => NormalizedInputEvent[];
  queueFakeEvent: (event: NormalizedInputEvent) => void;
  releaseAll: (reason: ReleaseAllInputEvent["reason"]) => ReleaseAllInputEvent;
};

export const noInputAdapterCapabilities: InputAdapterCapabilities = {
  readGlobalInput: false,
  suppressLocalInput: false,
  injectInput: false,
  readClipboard: false,
  networkTransport: false
};

export const emptyModifiers: InputModifiers = {
  shift: false,
  control: false,
  alt: false,
  meta: false
};

export function createFakeInputCaptureAdapter(id = "fake-input-adapter"): InputCaptureAdapter {
  const queuedEvents: NormalizedInputEvent[] = [];

  return {
    id,
    source: "fake",
    label: "Fake in-memory input adapter",
    capabilities: { ...noInputAdapterCapabilities },
    readQueuedEvents: () => queuedEvents.splice(0, queuedEvents.length),
    queueFakeEvent: (event) => {
      queuedEvents.push({ ...event, source: "fake" });
    },
    releaseAll: (reason) => {
      const event = createReleaseAllInputEvent(reason, "fake");
      queuedEvents.push(event);
      return event;
    }
  };
}

export function createReleaseAllInputEvent(
  reason: ReleaseAllInputEvent["reason"],
  source: InputEventSource,
  timestampMs = Date.now()
): ReleaseAllInputEvent {
  return {
    type: "release-all",
    phase: "release-all",
    source,
    timestampMs,
    targetMonitorId: null,
    reason
  };
}

export function applyInputEventToHeldState(state: HeldInputState, event: NormalizedInputEvent): HeldInputState {
  if (event.type === "release-all") return { heldKeys: [], heldPointerButtons: [] };

  if (event.type === "keyboard") {
    return {
      ...state,
      heldKeys: event.phase === "down"
        ? addUnique(state.heldKeys, event.code)
        : state.heldKeys.filter((code) => code !== event.code)
    };
  }

  if (event.type === "pointer-button") {
    return {
      ...state,
      heldPointerButtons: event.phase === "down"
        ? addUnique(state.heldPointerButtons, event.button)
        : state.heldPointerButtons.filter((button) => button !== event.button)
    };
  }

  return { heldKeys: [...state.heldKeys], heldPointerButtons: [...state.heldPointerButtons] };
}

export function sanitizeInputEventForLog(event: NormalizedInputEvent) {
  const base = {
    type: event.type,
    phase: event.phase,
    source: event.source,
    timestampMs: roundTimestamp(event.timestampMs),
    targetMonitorId: event.targetMonitorId
  };

  if (event.type === "keyboard") {
    return { ...base, code: event.code, modifiers: { ...event.modifiers } };
  }

  if (event.type === "pointer-button") {
    return { ...base, button: event.button };
  }

  if (event.type === "pointer-move" || event.type === "wheel") {
    return { ...base, deltaX: event.deltaX, deltaY: event.deltaY };
  }

  return { ...base, reason: event.reason };
}

function roundTimestamp(timestampMs: number) {
  return Math.round(timestampMs / 10) * 10;
}

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}
