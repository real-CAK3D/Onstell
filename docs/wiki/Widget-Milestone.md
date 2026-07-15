# Widget Milestone

The first usable interface milestone is the floating Onstell widget plus tray or menu-bar presence.

## Required Widget Behavior

- Draggable desktop widget.
- Remembered widget position.
- Hover-revealed upper-right cog button.
- Widget opacity slider.
- Idle opacity slider.
- Hover opacity slider.
- Lock widget position.
- Always-on-top mode.
- Normal window-level mode.
- Stay-behind-window mode where supported.
- Show-only-when-summoned mode.
- Hide and show from tray icon.
- Start minimized support.
- Single-instance behavior.
- Clear placeholder state before real connection features exist.

## Design Direction

The widget should feel like a compact glass control puck.

Default visual identity:

- Purple base
- Cyan connection accents
- Rose highlights
- Amber unavailable or caution state

The widget must remain readable when transparent.

## Routing Readiness Panel

Milestone 2 adds a design-only routing readiness panel to the widget settings surface. It must stay informational until the safety gates in [Input Forwarding Architecture](Input-Forwarding-Architecture) and [Clipboard Sync Design](Clipboard-Sync-Design) are satisfied.

Readiness states:

- Ready: the local placeholder model is available.
- Missing: an OS permission or implementation check is not present yet.
- Blocked: the feature is deliberately disabled until a release gate is satisfied.
- Design only: the UI state is modeled, but no real OS hook, network session, or clipboard transfer exists.

The panel must not trigger OS permission prompts, global input hooks, input injection, or clipboard access.
