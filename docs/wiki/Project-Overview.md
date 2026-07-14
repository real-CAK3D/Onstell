# Project Overview

Onstell connects multiple computers into a shared physical display layout.

The first production goal is seamless pointer and keyboard control across:

- Windows PCs
- Raspberry Pi
- Linux desktops
- macOS systems

Each computer keeps running its own operating system. Onstell moves control between devices; it does not move application windows between operating systems in Device Desktop mode.

## Core Ideas

- A computer and a monitor are different objects.
- A computer may expose one or more monitors.
- Monitors are arranged in a visual layout editor.
- Pointer transitions are based on the geometry of those monitor rectangles.
- Keyboard input follows the display containing the pointer.
- Missing devices stay in the saved layout but are removed from active routing.

## First Acceptance Setup

The first major acceptance test uses:

- Main Windows PC above
- Raspberry Pi below the main PC
- HP Windows laptop below or beside the Raspberry Pi

The user should be able to move down from Windows to the Pi, then onward to the laptop, and reverse back upward without restarting the app.

