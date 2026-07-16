# Read-Only Input Capture Spike

This spike exists to evaluate whether Onstell can observe local keyboard and pointer metadata safely before any forwarding code is written.

No production or beta build may enable read-only capture by default. The only supported gate is `VITE_ONSTELL_READONLY_CAPTURE_SPIKE=1` or `VITE_ONSTELL_READONLY_CAPTURE_SPIKE=true` in a development build. The guard must ignore the flag in packaged, production, CI, release, and update builds.

## Non-Goals

- Do not suppress local input.
- Do not inject input locally or remotely.
- Do not forward input over the network.
- Do not register the emergency shortcut as a global hotkey in this spike.
- Do not persist event logs by default.
- Do not read, log, store, or transmit typed text.
- Do not capture clipboard data.

## Dev-Only Guardrails

- The spike is opt-in only through the development flag.
- The default state is disabled.
- The widget readiness panel must continue to show that capture is design-only or development-only.
- Any future capture module must fail closed when the guard is disabled.
- Capture code must live behind a narrow interface that returns sanitized event metadata only.
- Any debug log must be console-only unless a separate explicit file-log flag is reviewed.
- The release command must remain callable before and during a spike.
- Turning the flag off and restarting the app must fully disable capture.

## Allowed Event Fields

The spike may log only:

- Event category: `keyboard`, `pointer`, or `wheel`.
- Event phase: `down`, `up`, `move`, or `scroll`.
- Physical key code or scan code when available, such as `KeyA`, not the produced character.
- Pointer button identity, such as `left`, `right`, or `middle`.
- Pointer delta, not absolute pointer history.
- Wheel delta.
- Modifier bitmask: shift, control, alt, meta.
- Target monitor id from the local layout model.
- Monotonic timestamp rounded to the nearest 10 ms.
- Permission state: granted, missing, blocked, or unknown.

## Forbidden Event Fields

The spike must never log:

- Typed characters or composed text.
- Full text input buffers.
- Passwords, secure-entry fields, or IME composition strings.
- Window titles, process names, URLs, browser tab titles, or document names.
- Absolute screen coordinates over time.
- Clipboard payloads.
- Device serial numbers or hardware IDs.
- Remote addresses, tokens, pairing secrets, or session keys.
- Raw HID payloads beyond the normalized fields listed above.

## Platform Notes

Windows:

- Evaluate Raw Input for read-only keyboard and mouse visibility.
- Do not call `SendInput` in this spike.
- Do not install services, drivers, or low-level hooks.
- Warn testers that elevated apps may behave differently from normal-integrity apps.
- Rollback: remove the development flag and restart Onstell.

macOS:

- Evaluate Core Graphics event taps only in a development build.
- Expect Accessibility and possibly Input Monitoring prompts.
- Do not request permissions until the user explicitly starts the spike.
- Warn testers how to revoke permissions in System Settings > Privacy & Security.
- Rollback: remove the development flag, restart Onstell, and revoke Accessibility/Input Monitoring permissions if granted.

Linux:

- Evaluate `evdev` only on a development machine.
- Do not create `uinput` devices in this spike.
- Do not install udev rules automatically.
- Warn testers that Wayland compositors may block global capture by design.
- Rollback: remove the development flag, restart Onstell, and remove any manually added input-group or udev test access.

## User-Visible Warning

Before a future spike starts observing input, the app must show a warning that says:

- The spike is development-only.
- No typed characters, clipboard data, window titles, or remote traffic will be logged.
- Local input will not be blocked or forwarded.
- The Release Input command remains available.
- Closing Onstell or turning off the flag stops the spike.

## Exit Criteria

The spike is complete only when:

- The guard has tests proving default-off behavior.
- The guard has tests proving production builds ignore the flag.
- A manual test records only allowed sanitized metadata.
- Permission-denied cases leave routing in local or blocked state.
- Emergency release can be called while the spike is active.
- Rollback steps have been tested on every platform touched by the spike.
