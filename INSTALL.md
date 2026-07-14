# Installing Onstell

Onstell does not have production installers yet. This document describes the intended install paths once the first release assets exist.

## Windows

Preferred:

1. Open the latest GitHub Release.
2. Download `Onstell-Setup-Windows-x64.exe`.
3. Double-click the installer.
4. Launch Onstell from the Start Menu.

Portable:

1. Download `Onstell-Windows-Portable-x64.zip`.
2. Extract it.
3. Run `Onstell.exe`.

The installer should eventually support startup registration, firewall prompts, Start Menu shortcuts, uninstallation through Windows Settings, and tray launch.

Windows does not allow ordinary apps to silently pin themselves to the taskbar. Onstell can provide a Start Menu shortcut and a "Pin Onstell to taskbar" help action.

## Raspberry Pi

Planned package:

```bash
curl -fsSL https://raw.githubusercontent.com/real-CAK3D/Onstell/main/scripts/install.sh -o install-onstell.sh
less install-onstell.sh
bash install-onstell.sh
```

The script will select `Onstell-RaspberryPi-arm64.deb` for supported ARM64 Raspberry Pi systems.

## Linux

Planned packages:

- `Onstell-Linux-x64.AppImage`
- `Onstell-Linux-x64.deb`
- `Onstell-Linux-arm64.AppImage`

Tray icon and window-layer behavior vary by desktop environment. Unsupported options should be disabled with a clear explanation.

## macOS

Planned package:

```text
Onstell-macOS-universal.dmg
```

The app will require Accessibility permission for input sharing. Screen Recording permission should only be needed for future screen-viewing or Virtual Monitor features.

## Uninstall

Uninstall instructions will be platform-specific once installers exist.

