# Security Policy

Onstell is early-stage and not ready for production input sharing.

## Reporting

For now, open a private security advisory on GitHub or contact the repository owner directly.

## Security Principles

- Pair devices explicitly.
- Authenticate every device before accepting input events.
- Provide an emergency release shortcut.
- Release held keys and buttons when a device disconnects.
- Never collect telemetry during update checks.
- Never require a GitHub account to install public releases.
- Keep Device Desktop mode and Virtual Monitor mode clearly separated.
- Do not advise users to disable operating-system security globally.

## Sensitive Data

Do not commit:

- Signing certificates.
- Private keys.
- GitHub tokens.
- Apple Developer credentials.
- Windows code-signing passwords.

