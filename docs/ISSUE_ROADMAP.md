# Onstell Issue Roadmap

This file mirrors the GitHub Issues that should drive the next development pass. The GitHub app connected to this Codex session could not create issues directly, so these are written as ready-to-copy issue bodies.

## Milestone 1: Local Widget and Device Layout Prototype

Goal: make Onstell feel useful before live KVM networking exists. The widget should let a user model devices and displays, arrange them visually, and persist that state.

### 1. Build manual device and monitor layout editor

Goal: let a user define manual devices and arrange their monitors.

Scope:
- Add a local/manual device list model.
- Add monitor rectangles with position, size, label, color, and role.
- Persist layout state locally.
- Render layout changes in the glass widget.

Acceptance:
- A user can add, edit, move, and remove at least two devices.
- Layout survives app restart.
- UI still works in the frameless glass window.

### 2. Add persisted widget settings

Goal: keep the high-fidelity glass widget feeling stable between launches.

Scope:
- Persist position, size, opacity, theme accent, and always-on-top mode.
- Add reset-to-default behavior.
- Avoid layout jumps when the app starts.

Acceptance:
- Widget settings survive restart.
- Reset returns to a sensible default layout.
- Settings failures degrade without crashing the app.

### 3. Create tray controls and window actions

Goal: make the desktop shell manageable without taskbar friction.

Scope:
- Add tray/menu commands for show, hide, reset position, settings, and quit.
- Keep the frameless widget recoverable if moved off-screen.
- Prepare command hooks for later pause/resume input routing.

Acceptance:
- User can hide and restore the widget from tray/menu.
- User can reset the window position.
- Quit exits cleanly.

### 4. Define the device/layout data model

Goal: establish the local model that later discovery, pairing, and input routing will use.

Scope:
- Define device, monitor, edge, profile, and availability types.
- Keep the model serializable.
- Document assumptions in code or docs.

Acceptance:
- The UI uses typed layout data instead of ad hoc state.
- The model supports multiple devices and multiple monitors per device.
- Future discovery can populate the same model.

### 5. Prototype device discovery stub

Goal: create the shape of discovery without depending on final networking.

Scope:
- Add a discovery service interface.
- Implement fake/local discovery for development.
- Display availability states in the widget.

Acceptance:
- Fake devices can appear/disappear in the UI.
- Discovery state does not block manual layout editing.
- Interface can later be backed by LAN discovery.

### 6. Design pairing and trust flow

Goal: specify how two machines will trust each other before input forwarding exists.

Scope:
- Document pairing states and user prompts.
- Decide minimum local-network identity fields.
- Define how rejected/forgotten devices behave.

Acceptance:
- Wiki or docs describe the pairing flow.
- UI has placeholder states for unpaired, pending, trusted, and blocked.
- No sensitive token or private key material is committed.

### 7. Plan input forwarding architecture

Goal: make the risky KVM core explicit before implementation.

Scope:
- Define controller/follower roles.
- Document pointer edge detection.
- Document keyboard routing and emergency release shortcut.
- List OS-specific APIs or crates to evaluate.

Acceptance:
- There is an implementation plan for Windows, macOS, and Linux input capture/injection.
- Emergency release behavior is defined before input capture work begins.
- Security and accessibility permission needs are documented.

### 8. Add clipboard sync design

Goal: prepare safe clipboard sharing across trusted devices.

Scope:
- Define what clipboard formats are in scope first.
- Decide opt-in behavior and size limits.
- Document privacy/security expectations.

Acceptance:
- Clipboard sync has a short design doc.
- Binary/large payload behavior is explicitly deferred or constrained.
- The UI has a placeholder for clipboard sync status.

### 9. Add release hygiene cleanup task

Goal: keep GitHub Releases clean while the project is still in beta.

Scope:
- Keep `v0.1.0-beta.3` as the first clean development release.
- Delete or mark obsolete any failed/messy draft release from `v0.1.0-beta.2`.
- Keep failed `beta.1` and `beta.2` tags only if useful for audit history.

Acceptance:
- GitHub Releases page shows the clean current beta clearly.
- Draft/failed releases do not confuse users.
- Release notes call out that this is a smoke-test desktop shell, not a working KVM yet.

