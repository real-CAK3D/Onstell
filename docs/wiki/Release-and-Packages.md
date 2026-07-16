# Release and Packages

Onstell should be distributed through GitHub Releases.

GitHub Packages is not the main distribution path for normal users. GitHub Releases is the right place for downloadable installers, portable archives, checksums, and release notes.

## Planned Assets

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

## Windows

The best user experience is a normal installer:

```text
Onstell-Setup-Windows-x64.exe
```

It should add Start Menu shortcuts, register uninstall support, and optionally start Onstell at sign-in.

## Raspberry Pi

The planned package is:

```text
Onstell-RaspberryPi-arm64.deb
```

The install script should detect ARM64 and download the matching release asset.

## Linux

Provide both AppImage and deb packages when practical.

## macOS

Provide a universal DMG for Intel and Apple Silicon Macs.

## Current Release Workflow

The current GitHub workflow builds Windows, Linux x64, and macOS Tauri bundles, creates `SHA256SUMS.txt`, and can create a draft GitHub Release.

Beta.3 remains the first clean desktop-shell smoke-test release. Beta.4 should use [v0.1.0-beta.4 release checklist](../releases/v0.1.0-beta.4.md) and must clearly label routing, capture, transport, and clipboard behavior as simulated or design-only.

Failed or duplicate draft releases should be deleted before retrying so the Releases page stays clean.
