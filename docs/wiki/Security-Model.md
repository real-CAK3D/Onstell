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

## Signing and Trust

Plan for:

- Windows code signing.
- macOS Developer ID signing and notarization.
- SHA-256 checksum publication.
- Optional GitHub artifact attestations.
- Signed update metadata before automatic updates.

Do not commit credentials, certificates, private keys, or signing passwords.

