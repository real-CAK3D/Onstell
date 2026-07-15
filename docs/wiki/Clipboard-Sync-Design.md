# Clipboard Sync Design

Clipboard sync is useful, but it is also easy to make unsafe. Onstell should treat clipboard data as private user content and only sync it across explicitly trusted devices.

No milestone 1 code should read, write, watch, or transmit real clipboard data. The current widget only shows a design-only status placeholder.

## Default Behavior

Clipboard sync is off by default.

The first real implementation must require:

- A trusted paired device.
- An authenticated encrypted session.
- Explicit opt-in from the local user.
- A visible widget status when sync is enabled.
- A quick pause/disable control.

Clipboard sync must never run for unpaired, pending, blocked, offline, or unknown devices.

## First Supported Formats

Start narrow:

- Plain UTF-8 text.
- Small URLs as plain text.
- Optional plain-text metadata: source device id, monotonic change id, byte size, and timestamp.

Defer:

- Images.
- Rich text.
- HTML.
- Files and file lists.
- App-specific binary formats.
- Password-manager protected fields.
- Clipboard history.

The first implementation should preserve user intent better by syncing only after an explicit copy operation is detected, not by continuously scraping clipboard contents on a timer.

## Size Limits

Initial limits:

- Text payload limit: 64 KiB.
- URL payload limit: 8 KiB.
- Metadata limit: 2 KiB.
- Rate limit: one accepted clipboard update per second per device.

Behavior for large payloads:

- Do not send automatically.
- Show "too large" in the local status/log.
- Leave the remote clipboard unchanged.
- Offer no file-transfer fallback until the file-transfer design exists.

Binary payload behavior:

- Binary clipboard content is explicitly out of scope for the first sync milestone.
- Image, file, rich text, and custom-format clipboard data must be ignored.
- If a clipboard contains both text and richer formats, only plain text may be considered, and the UI must not imply rich formatting was preserved.

## Direction and Consent

Recommended first mode:

- Manual bidirectional sync between the controller and one active trusted follower.
- Sync pauses when the active target is cleared.
- Sync pauses on emergency release.
- Sync pauses when input forwarding is disabled.

Future modes can add:

- Per-device allow lists.
- Send-only or receive-only behavior.
- One-shot "send clipboard to active device".
- Clipboard history exclusion.

## Privacy Rules

- Do not store clipboard payloads in logs.
- Do not write clipboard payloads to local persistent storage.
- Do not include clipboard contents in crash reports.
- Do not sync clipboard data while a device is blocked or trust is revoked.
- Do not auto-enable clipboard sync during pairing.
- Do not expose clipboard content in discovery messages.
- Treat clipboard data as sensitive even when it is plain text.

## Security Rules

- Every clipboard update must be tied to a trusted device identity.
- Every clipboard update must be carried inside the authenticated encrypted session.
- The receiver should reject stale, replayed, oversized, or malformed updates.
- The sender should attach a monotonic change id to prevent loops.
- The receiver should mark writes it originated from Onstell so they do not echo back forever.
- The receiver should release or clear in-memory payload buffers after writing.

## Status Model

The widget can represent clipboard sync with these states:

- `Off`: sync is disabled.
- `Ready`: sync is enabled, but no clipboard payload is in flight.
- `Paused`: sync is temporarily disabled because input forwarding, trust, or target selection is inactive.
- `Blocked`: the target is blocked or untrusted.
- `Too large`: the last clipboard payload exceeded the configured size limit.
- `Design only`: placeholder state before real clipboard APIs are wired.

Milestone 1 uses `Design only`.

## API and Crate Evaluation

Evaluate these before implementation:

- Tauri clipboard plugin for explicit text read/write permissions.
- `arboard` for cross-platform Rust clipboard access.
- Windows Clipboard API for native change notifications and format handling.
- macOS `NSPasteboard` for native pasteboard access.
- Linux X11 and Wayland clipboard behavior separately, because selection ownership and compositor restrictions differ.

Initial recommendation:

- Use Tauri's clipboard plugin for a permission-scoped prototype if it covers the needed desktop behavior.
- Keep production sync behind Rust commands so trust checks, size limits, and transport rules are enforced outside the web UI.
- Add OS-specific backend modules only after the text-only prototype proves the state machine.

## Implementation Phases

1. Design-only widget state.
2. Local clipboard status detector with no payload logging.
3. Text-only manual send to a local test receiver.
4. Text-only trusted-device sync with size and rate limits.
5. Pause/resume controls and per-device preferences.
6. Rich text/image/file design review before any binary format support.

## References

- Tauri clipboard plugin: https://v2.tauri.app/plugin/clipboard/
- Windows Clipboard overview: https://learn.microsoft.com/en-us/windows/win32/dataxchg/clipboard
- Apple NSPasteboard documentation: https://developer.apple.com/documentation/appkit/nspasteboard
- Wayland protocol model: https://wayland.freedesktop.org/docs/book/Protocol.html
- `arboard` crate: https://docs.rs/arboard/latest/arboard/
