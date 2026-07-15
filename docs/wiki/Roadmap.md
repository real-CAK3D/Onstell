# Roadmap

## Milestone 0: Repo and Prototype

- Product name and visual identity.
- Glass floating-widget prototype.
- Documentation.
- Release and install plan.
- GitHub workflow skeletons.

## Milestone 1: Native Shell

- Tauri app scaffold. Started.
- Tray or menu-bar icon.
- Floating widget window.
- Single-instance behavior.
- Start minimized behavior.
- Persisted widget settings.
- Local layout editor and fake discovery.
- Pairing, trust, input-forwarding, and clipboard design placeholders.

Status: complete as of `v0.1.0-beta.3`.

## Milestone 2: Trusted Local Routing Prototype

- Permission and routing status panel.
- Input routing state machine without OS hooks.
- Emergency release command in UI and tray.
- Read-only input capture spike plan and dev guard.
- Local loopback follower simulator.
- Trusted LAN pairing/session transport design.
- `v0.1.0-beta.4` release checklist.

Milestone 2 must keep real capture, suppression, injection, clipboard transfer, and LAN control disabled by default until the safety gates are proven.

## Milestone 3: Fixed Controller Input

- Fixed controller mode.
- Pointer edge detection.
- Keyboard routing.
- Emergency release shortcut.
- Basic pairing.

See [Input Forwarding Architecture](Input-Forwarding-Architecture) before implementing capture, injection, or routing.

See [Clipboard Sync Design](Clipboard-Sync-Design) before implementing clipboard read, write, watch, or transfer behavior.

## Milestone 4: Release Installers

- Windows installer and portable ZIP.
- Linux x64 package.
- Raspberry Pi ARM64 package.
- macOS DMG.
- Checksums and release notes.

## Later: Virtual Monitor Mode

Virtual Monitor mode should wait until Device Desktop mode is stable.
