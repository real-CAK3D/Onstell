# Onstell

Onstell is an early-stage cross-platform software KVM project. Its goal is to make multiple physical computers feel like one coordinated display layout: the pointer moves between machines, keyboard input follows the active screen, and each computer keeps running its own operating system and applications.

The first target is **Device Desktop mode**. In this mode, Onstell shares pointer, keyboard, clipboard, and later file-transfer control between devices. It does not stream video, and it does not pretend that a Raspberry Pi or laptop is a real Windows monitor.

**Virtual Monitor mode** is a future, separate feature. That mode would require virtual display drivers, capture, low-latency streaming, coordinate mapping, and platform-specific security work.

## Current Status

This repository is at milestone 0:

- Onstell branding and repository structure.
- Hi-fi glass floating widget prototype.
- Documented release and installer plan.
- GitHub workflow skeletons for CI, release, and security checks.
- Install scripts that are ready to connect to real release assets once binaries exist.

The real low-level KVM backend, native tray app, input routing, pairing, and signed installers are not implemented yet.

## Widget Direction

The first usable interface milestone is a lightweight floating desktop widget with:

- Draggable placement.
- Remembered widget position.
- Hover-revealed upper-right cog menu.
- Widget, idle, and hover opacity controls.
- Lock-position setting.
- Always-on-top, normal, behind-window, and summoned-only layer modes.
- System tray or menu-bar access.
- Single-instance behavior.
- Honest connection placeholders until real devices are paired.

Open the prototype locally:

```text
prototype/onstell-widget.html
```

## Planned Install Options

End users should install Onstell from GitHub Releases, not by cloning the source.

Planned release assets:

```text
Onstell-Setup-Windows-x64.exe
Onstell-Windows-x64.msi
Onstell-Windows-Portable-x64.zip
Onstell-Linux-x64.AppImage
Onstell-Linux-x64.deb
Onstell-RaspberryPi-arm64.deb
Onstell-Linux-arm64.AppImage
Onstell-macOS-universal.dmg
Onstell-macOS-universal.zip
SHA256SUMS.txt
RELEASE-NOTES.md
```

See [INSTALL.md](INSTALL.md), [BUILDING.md](BUILDING.md), and [RELEASING.md](RELEASING.md).

## Safety

Onstell will eventually capture and forward keyboard and pointer input. That makes pairing, authentication, local network trust, emergency release shortcuts, and clear permissions essential.

Do not run unknown builds of software KVM tools on machines you do not trust. Early unsigned builds may trigger Windows SmartScreen or macOS Gatekeeper warnings. Do not disable operating-system security features globally.

## Development

This repo is intentionally starting small. The next engineering step is to choose the native app stack and build the real tray/widget shell around the prototype.

Likely stack:

- Tauri for cross-platform desktop packaging.
- Rust for native input, networking, and platform integration.
- TypeScript for the widget UI.
- GitHub Releases for public installers.

