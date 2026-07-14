# Virtual Monitor Mode

Virtual Monitor mode is a future feature. It is not part of the initial milestone.

In this mode, another device can act as a real extended display for a host computer.

Example:

```text
Windows PC creates virtual Display 2
Display 2 is captured and streamed
Raspberry Pi displays the stream fullscreen
Pointer and keyboard events are returned to Windows
```

## Likely Requirements

- Signed Windows virtual display driver.
- Linux virtual display support.
- macOS platform-specific display support.
- Desktop capture.
- Hardware-assisted video encoding.
- Low-latency transport such as WebRTC.
- Remote cursor synchronization.
- Resolution negotiation.
- Frame pacing.
- Reconnection handling.

## Separation Rule

Do not present Device Desktop mode as a true extended monitor. The interface and documentation must keep these modes separate.

