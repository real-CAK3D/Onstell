# Security Model

Onstell will eventually forward keyboard and pointer input. That means the security model must be designed before the app is trusted for daily use.

## Requirements

- Explicit device pairing.
- Authenticated device sessions.
- No unauthenticated input injection.
- Emergency release shortcut.
- Held keys and mouse buttons released on disconnect.
- Clear permission onboarding on macOS and Linux.
- Disableable update checks.
- No telemetry during update checks.

See [Pairing and Trust](Pairing-and-Trust) for the current placeholder state model and the future real pairing flow.

See [Input Forwarding Architecture](Input-Forwarding-Architecture) for controller/follower roles, pointer edge transfer, keyboard routing, emergency release behavior, and OS permission requirements.

## Trust States

- Local: this machine.
- Unpaired: visible but not trusted.
- Pending: pairing started but not confirmed.
- Trusted: allowed to participate in future control sessions.
- Blocked: explicitly denied until the user changes it.

Input, clipboard, and file-transfer features must only target trusted devices.

## Emergency Release

Input forwarding must not ship until emergency release behavior is implemented and tested.

- Windows/Linux default: Ctrl+Alt+Escape.
- macOS default: Control+Option+Escape.
- The shortcut is always handled locally and never forwarded.
- It releases all held keys and pointer buttons locally and remotely.
- It clears the active target and returns the widget to a disconnected state.

## Signing and Trust

Plan for:

- Windows code signing.
- macOS Developer ID signing and notarization.
- SHA-256 checksum publication.
- Optional GitHub artifact attestations.
- Signed update metadata before automatic updates.

Do not commit credentials, certificates, private keys, or signing passwords.
