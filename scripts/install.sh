#!/usr/bin/env bash
set -euo pipefail

REPO="real-CAK3D/Onstell"
VERSION="${1:-latest}"

echo "Onstell installer bootstrap"
echo "Repository: ${REPO}"
echo "Version: ${VERSION}"

case "$(uname -m)" in
  x86_64|amd64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

case "$(uname -s)" in
  Linux) OS="Linux" ;;
  Darwin) OS="macOS" ;;
  *) echo "Unsupported OS: $(uname -s)" >&2; exit 1 ;;
esac

if [ "$OS" = "Linux" ] && [ "$ARCH" = "arm64" ]; then
  ASSET="Onstell-RaspberryPi-arm64.deb"
elif [ "$OS" = "Linux" ]; then
  ASSET="Onstell-Linux-x64.AppImage"
else
  ASSET="Onstell-macOS-universal.dmg"
fi

if [ "$VERSION" = "latest" ]; then
  URL="https://github.com/${REPO}/releases/latest/download/${ASSET}"
else
  URL="https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}"
fi

echo "This script is not active until Onstell release assets exist."
echo "Planned asset: ${ASSET}"
echo "Planned URL: ${URL}"
echo "Download will be enabled after the first packaged release."

