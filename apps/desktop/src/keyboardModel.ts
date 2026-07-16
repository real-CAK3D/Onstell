import { emptyModifiers, type InputEventSource, type InputModifiers, type KeyboardInputEvent } from "./inputEvents";

export type KeyboardPhase = "down" | "up";

export type KeyboardNormalizationInput = {
  phase: KeyboardPhase;
  source: InputEventSource;
  timestampMs: number;
  targetMonitorId: string | null;
  code: string;
  modifiers?: Partial<InputModifiers>;
};

export type KeyboardBlockReason = "missing-code" | "secure-attention" | "emergency-release";

export type KeyboardHeldState = {
  heldKeys: string[];
  modifiers: InputModifiers;
};

export type KeyboardNormalizationResult =
  | {
      type: "forwardable";
      event: KeyboardInputEvent;
      held: KeyboardHeldState;
    }
  | {
      type: "blocked";
      reason: KeyboardBlockReason;
      code: string | null;
      held: KeyboardHeldState;
    };

export type SanitizedKeyboardDecisionLog = {
  type: KeyboardNormalizationResult["type"];
  phase: KeyboardPhase | null;
  source: InputEventSource | null;
  timestampMs: number | null;
  targetMonitorId: string | null;
  code: string | null;
  modifiers: InputModifiers;
  reason: KeyboardBlockReason | null;
};

export const emptyKeyboardHeldState: KeyboardHeldState = {
  heldKeys: [],
  modifiers: { ...emptyModifiers }
};

export function normalizeKeyboardEvent(
  input: KeyboardNormalizationInput,
  held: KeyboardHeldState = emptyKeyboardHeldState
): KeyboardNormalizationResult {
  const normalizedModifiers = normalizeModifiers(input.modifiers);
  const nextHeld = updateHeldKeys({
    heldKeys: [...held.heldKeys],
    modifiers: normalizedModifiers
  }, input.phase, input.code);

  const code = input.code.trim();
  if (!code) {
    return { type: "blocked", reason: "missing-code", code: null, held: nextHeld };
  }

  if (isEmergencyReleaseShortcut(code, normalizedModifiers)) {
    return { type: "blocked", reason: "emergency-release", code, held: nextHeld };
  }

  if (isSecureAttentionSequence(code, normalizedModifiers)) {
    return { type: "blocked", reason: "secure-attention", code, held: nextHeld };
  }

  return {
    type: "forwardable",
    event: {
      type: "keyboard",
      phase: input.phase,
      source: input.source,
      timestampMs: input.timestampMs,
      targetMonitorId: input.targetMonitorId,
      code,
      modifiers: normalizedModifiers
    },
    held: nextHeld
  };
}

export function isSecureAttentionSequence(code: string, modifiers: InputModifiers) {
  return code === "Delete" && modifiers.control && modifiers.alt;
}

export function isEmergencyReleaseShortcut(code: string, modifiers: InputModifiers) {
  return code === "Escape" && modifiers.control && modifiers.alt;
}

export function sanitizeKeyboardDecisionForLog(result: KeyboardNormalizationResult): SanitizedKeyboardDecisionLog {
  if (result.type === "blocked") {
    return {
      type: "blocked",
      phase: null,
      source: null,
      timestampMs: null,
      targetMonitorId: null,
      code: result.code,
      modifiers: { ...result.held.modifiers },
      reason: result.reason
    };
  }

  return {
    type: "forwardable",
    phase: result.event.phase,
    source: result.event.source,
    timestampMs: roundTimestamp(result.event.timestampMs),
    targetMonitorId: result.event.targetMonitorId,
    code: result.event.code,
    modifiers: { ...result.event.modifiers },
    reason: null
  };
}

function updateHeldKeys(held: KeyboardHeldState, phase: KeyboardPhase, code: string): KeyboardHeldState {
  const normalizedCode = code.trim();
  if (!normalizedCode) return held;
  return {
    ...held,
    heldKeys: phase === "down"
      ? addUnique(held.heldKeys, normalizedCode)
      : held.heldKeys.filter((candidate) => candidate !== normalizedCode)
  };
}

function normalizeModifiers(modifiers: Partial<InputModifiers> | undefined): InputModifiers {
  return {
    shift: modifiers?.shift ?? false,
    control: modifiers?.control ?? false,
    alt: modifiers?.alt ?? false,
    meta: modifiers?.meta ?? false
  };
}

function roundTimestamp(timestampMs: number) {
  return Math.round(timestampMs / 10) * 10;
}

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}
