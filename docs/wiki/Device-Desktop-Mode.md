# Device Desktop Mode

Device Desktop mode is the first implementation target.

In this mode:

- Every computer displays its own operating system.
- Applications remain on the computer where they are running.
- Pointer control moves between devices.
- Keyboard input follows the active pointer display.
- Clipboard sharing can be added after basic input routing.
- File transfer can be added later as a separate feature.

This mode should feel like one extended group of displays even though each display belongs to a separate computer.

## Why First

Device Desktop mode has:

- Low latency.
- Low network use.
- No video compression.
- Clear operating-system ownership.
- Better performance on Raspberry Pi hardware.

## Important Limitation

You cannot drag a Windows application window onto a Raspberry Pi screen in Device Desktop mode. That requires Virtual Monitor mode.

