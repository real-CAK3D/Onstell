# Releasing Onstell

Onstell should distribute compiled installers through GitHub Releases.

## Versioning

Use Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Examples:

```text
v0.1.0
v0.2.0
v1.0.0
v1.1.0-beta.1
```

Version values must eventually match across app metadata, package metadata, installer metadata, and protocol compatibility metadata.

## Release Channels

- Stable: `v1.0.0`
- Beta: `v1.1.0-beta.1`
- Nightly/development: workflow artifacts or explicit prereleases

Stable users should not be auto-offered beta or nightly builds.

## Release Assets

Expected asset names:

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

## Trust

Before unattended updates or one-click installers:

- Sign Windows builds.
- Sign and notarize macOS builds.
- Publish SHA-256 checksums.
- Verify release assets before installation.
- Protect against downgrade attacks.
- Keep update checks disableable.

Do not commit certificates, private keys, passwords, or tokens.

