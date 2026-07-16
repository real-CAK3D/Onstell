# Input Forwarding Architecture

Onstell's input-forwarding core is the riskiest part of the product. This page is the implementation plan that must be satisfied before real keyboard or pointer capture is enabled.

No milestone 1 code should capture global input, suppress local input, inject remote input, or sync clipboard data. The current app may only model devices, layout, trust, and placeholder states.

## Roles

- Controller: the local machine that owns the physical keyboard and pointer for the active session.
- Follower: a trusted remote machine that may receive forwarded pointer and keyboard events.
- Local desktop: the controller's own display space. Pointer and keyboard events stay local here.
- Active target: the currently selected trusted follower that receives forwarded events after edge transfer.

Only a trusted follower can become the active target. Unpaired, pending, blocked, offline, or unknown devices must never receive input.

## Event Pipeline

1. Capture pointer position and button/key state on the controller.
2. Compare pointer position against the configured monitor layout.
3. Detect a crossing from a local monitor edge into a trusted follower monitor edge.
4. Start a remote-control session only if the target is trusted and available.
5. Send relative pointer movement, pointer button events, wheel events, and keyboard scan events over an authenticated encrypted session.
6. Inject events on the follower through the follower's OS-specific injection backend.
7. On edge return, disconnect, trust loss, or emergency release, stop forwarding and release every held key and pointer button on both sides.

## Pointer Edge Detection

The layout model already stores monitor rectangles, sides, scale, and offsets. The input router should treat these as one logical coordinate space.

Edge transfer rules:

- A transfer begins when the pointer crosses a configured edge of the controller's active monitor.
- The target monitor is selected by matching the edge direction and nearest overlapping span.
- A small hysteresis band should prevent rapid bouncing when the pointer sits directly on an edge.
- The first remote pointer position should be clamped inside the target monitor, not exactly on its outer edge.
- Blocked or untrusted targets cancel the transfer and keep the pointer local.
- Pointer capture must not start while a modal permission prompt, pairing prompt, or settings dialog is active.

Suggested initial behavior:

- Use a 6 px edge threshold.
- Use a 12 px re-entry hysteresis band.
- Warp the follower cursor 12 px inside the target edge.
- Require one full pointer-up cycle before forwarding drag operations across machines.

## Keyboard Routing

Keyboard routing should preserve physical key intent first and text intent second.

Routing rules:

- Track key-down and key-up state while a follower is active.
- Forward physical key identity plus modifier state for shortcuts.
- Forward text input separately later if needed for IME, dead-key, emoji, or composed-character support.
- Never forward secure attention sequences such as Ctrl+Alt+Del on Windows.
- Never forward the emergency release shortcut.
- Release all held remote keys before switching active targets.
- Release all held remote keys when the local app loses trust, network, focus authority, or permissions.

The first implementation should prefer a narrow supported-key set over broad unreliable key mapping. Unknown keys should pass through locally until their OS mappings are tested.

## Emergency Release

Emergency release is mandatory before global capture ships.

Default shortcut:

- Windows/Linux: Ctrl+Alt+Escape.
- macOS: Control+Option+Escape.

Behavior:

- The shortcut is always handled locally by the controller.
- It is never forwarded to a follower.
- It immediately disables forwarding.
- It releases every tracked key and pointer button locally and remotely.
- It clears the active target.
- It returns the pointer to the controller's primary monitor center when supported.
- It shows an obvious disconnected state in the widget.
- It must work even when the active remote device is slow, disconnected, or misbehaving.

Fallbacks:

- Tray/menu item: Release Input.
- Widget button: Release Input.
- Process exit handler: release all locally tracked down states before shutdown.

Milestone 2 exposes the Release Input command in the widget and tray as a safe stub before real input forwarding exists. The default shortcut above is documented for the future release gate, but no global hotkey should be registered until the read-only capture and release-all behavior are tested.

## Permission Model

Input capture and injection require explicit user-facing permission checks.

Windows:

- Capture candidate: Raw Input for keyboard/mouse HID events.
- Injection candidate: SendInput for keyboard and pointer events.
- Permission concern: SendInput is subject to User Interface Privilege Isolation; Onstell should not promise injection into elevated apps unless Onstell itself is running at a compatible integrity level.
- Packaging concern: code signing is needed before broad beta testing.

macOS:

- Capture candidate: Core Graphics event taps through CGEvent APIs.
- Injection candidate: CGEvent posting through Core Graphics.
- Permission concern: Accessibility permission is required for global listening/grabbing and event posting; Input Monitoring may also be needed depending on capture approach.
- Packaging concern: Developer ID signing and notarization should happen before asking testers to grant Accessibility permission.

Linux:

- Capture candidate: evdev for low-level device events, with X11 fallback for limited desktop testing.
- Injection candidate: uinput virtual devices, preferably through a maintained Rust wrapper rather than direct ioctl calls.
- Permission concern: evdev and uinput often require root, input/uinput group access, udev rules, or a broker such as systemd-logind.
- Wayland concern: global capture/injection is intentionally restricted by many compositors; Onstell must either use compositor portals/protocols where available or document unsupported environments.

## API and Crate Evaluation

Evaluate these before choosing the backend:

- Windows native APIs: Raw Input for capture; SendInput for injection.
- Windows Rust bindings: `windows` crate for direct Win32 API calls.
- macOS native APIs: Core Graphics `CGEvent`, event taps, and event posting.
- macOS Rust bindings: `core-graphics`, `objc2`, or backend code inside a higher-level crate.
- Linux native APIs: evdev for capture; uinput for injection.
- Linux Rust crates: `evdev` for event-device access and uinput support.
- Cross-platform crates: `rdev`, `enigo`, and `device_query` as prototypes or comparison points, not automatic production choices.

Initial recommendation:

- Prototype with `rdev` or `device_query` for read-only event visibility where permissions allow.
- Prototype injection with `enigo` only in a test harness.
- Move production code toward OS-specific backends once the event model and emergency release behavior are proven.

## Implementation Phases

1. Model only: define input events, target state, release behavior, and permission status without OS hooks.
2. Read-only capture spike: log sanitized local pointer/key events without forwarding or suppression.
3. Injection harness: inject into a local test window only, never into arbitrary apps.
4. Loopback session: route events from controller to a local follower simulator.
5. Trusted LAN session: route to one trusted follower with emergency release enabled.
6. Multi-device routing: support target switching and monitor-edge hysteresis.
7. Clipboard/file transfer: design separately after input routing and trust revocation are stable.

The read-only capture spike must follow [Read-Only Input Capture Spike](Read-Only-Input-Capture-Spike) before any capture crate or OS hook is added.

The loopback phase must follow [Loopback Follower Simulator](Loopback-Follower-Simulator): in-process, fake-only, and gated by the same trust rules as normal routing.

The first trusted LAN phase must follow [Pairing Session Transport](Pairing-Session-Transport) before accepting any remote routing message.

## Routing State Machine

The milestone 2 routing model lives in `apps/desktop/src/routingModel.ts`. It is intentionally pure TypeScript and must not import OS capture, injection, clipboard, transport, or Tauri APIs.

Current states:

- `local`: no remote target is active.
- `armed`: a trusted available target is selected, but no events are forwarding.
- `forwarding`: simulated routing is active for a trusted available follower.
- `paused`: routing is temporarily inactive.
- `releasing`: held key/button state must be released before returning local.
- `blocked`: the requested target failed trust, availability, or role checks.
- `error`: an unexpected routing failure was recorded.

The `npm run test:routing` check covers trust gating, blocked target cases, disconnect, permission loss, target change, trust loss, and emergency release transitions.

## Safety Gates

Do not enable real forwarding until all gates pass:

- Pairing state is trusted.
- Session transport is authenticated and encrypted.
- Session handshake rejects replay, downgrade, blocked, revoked, pending, unknown, and unpaired peers.
- Emergency release shortcut is registered and tested after the no-hook UI stub phase.
- Release-all behavior is tested on disconnect, crash, and target switch.
- Permissions are detected and explained before capture starts.
- The app has a visible active-target indicator.
- Blocked devices cannot be selected by discovery or layout routing.
- Automated tests cover trust gating and release state transitions.
- Read-only capture remains disabled by default and cannot be enabled outside a development build.

## References

- Windows Raw Input overview: https://learn.microsoft.com/en-us/windows/win32/inputdev/about-raw-input
- Windows SendInput documentation: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput
- Apple Core Graphics CGEvent documentation: https://developer.apple.com/documentation/coregraphics/cgevent
- Linux uinput documentation: https://docs.kernel.org/input/uinput.html
- `evdev` crate: https://docs.rs/evdev/latest/evdev/
- `rdev` crate: https://docs.rs/rdev/latest/rdev/
- `enigo` crate: https://docs.rs/enigo/latest/enigo/
- `device_query` crate: https://docs.rs/device_query/latest/device_query/
