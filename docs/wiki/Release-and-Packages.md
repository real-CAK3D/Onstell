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

The current GitHub workflow creates a release-plan artifact and can create a draft GitHub Release with placeholder metadata. Real native assets will be attached after the Tauri/native app scaffold exists.

