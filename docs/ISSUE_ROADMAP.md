# Onstell Issue Roadmap

This file mirrors the active GitHub Issues that drive the next development pass.

## Milestone 1: Local Widget and Device Layout Prototype

Status: complete.

Completed tracker:

- #11 Milestone 1 tracker: local widget and device layout prototype.

Completed work:

- #2 Build manual device and monitor layout editor.
- #3 Add persisted widget settings.
- #4 Create tray controls and window actions.
- #5 Define the device and layout data model.
- #6 Prototype device discovery stub.
- #7 Design pairing and trust flow.
- #8 Plan input forwarding architecture.
- #9 Add clipboard sync design.
- #10 Maintain release hygiene for early betas.

## Milestone 2: Trusted Local Routing Prototype

Goal: move from a local widget/layout shell into a trusted local routing prototype without enabling unsafe global input capture too early.

Tracker:

- #12 Milestone 2 tracker: trusted local routing prototype.

### #13 Add permission and routing status panel

Goal: make OS permissions and routing readiness visible before real input capture/injection exists.

Scope:

- Add a compact status section to the widget settings panel.
- Show placeholder permission states for input capture, input injection, accessibility, clipboard, and transport.
- Keep all states design-only or simulated until real platform checks exist.
- Link the status language to the input-forwarding and clipboard design docs.

Acceptance:

- The widget has a visible routing/permission readiness placeholder.
- States clearly distinguish ready, missing, blocked, and design-only.
- No real OS permission prompts or global input hooks are added.
- Local checks and CI pass.

### #14 Model input routing state machine without OS hooks

Goal: create a testable routing model before connecting platform capture or injection APIs.

Scope:

- Define routing states such as local, armed, forwarding, paused, releasing, blocked, and error.
- Define events for trust change, target change, edge crossing, disconnect, emergency release, and permission loss.
- Keep the model serializable or easy to inspect in tests.
- Add focused tests for trust gating and release transitions.

Acceptance:

- Routing transitions can be tested without OS hooks.
- Untrusted, pending, blocked, offline, and unknown devices cannot enter forwarding state.
- Emergency release always transitions to a non-forwarding state.
- Tests cover the main happy path and safety failures.

### #15 Wire emergency release command in UI and tray

Goal: make emergency release visible and callable before real input forwarding exists.

Scope:

- Add a Release Input action to the widget and tray/menu.
- Add a native command stub that clears active forwarding state once that state exists.
- Show a clear released/disconnected status in the widget.
- Document the future keyboard shortcut but do not register global hotkeys yet.

Acceptance:

- Release Input appears in the widget and tray/menu.
- The command is safe to call while no forwarding exists.
- The UI makes it obvious that input is released or not forwarding.
- No global keyboard hooks are added in this issue.

### #16 Create read-only input capture spike plan and dev guard

Goal: prepare a read-only capture experiment without accidentally shipping capture behavior to normal users.

Scope:

- Add a docs page or spike note for read-only capture evaluation.
- Define dev-only guardrails for any future capture code.
- List platform-specific permissions and rollback steps.
- Decide what sanitized event fields may be logged during a spike.

Acceptance:

- Read-only capture cannot be enabled by default.
- The spike plan says exactly what may and may not be logged.
- OS permission requirements and user-visible warnings are documented.
- No input suppression, injection, or forwarding is implemented.

### #17 Add local loopback follower simulator

Goal: exercise controller/follower state locally before LAN transport and OS injection exist.

Scope:

- Add a loopback follower interface or service that receives simulated routing events.
- Display loopback status in the widget or dev panel.
- Keep the simulator in-process and explicitly fake.
- Use it to test trust gating, target changes, and release behavior.

Acceptance:

- A local fake follower can receive simulated pointer/key routing events.
- The simulator does not touch real keyboard, pointer, clipboard, or network APIs.
- Tests or documented manual steps prove emergency release clears simulated held state.

### #18 Design pairing session transport for trusted LAN prototype

Goal: choose the first practical session shape for trusted LAN experiments.

Scope:

- Define session identity, handshake, and reconnect expectations.
- Decide whether the first prototype uses WebSocket, QUIC, TCP, or another transport.
- Document how trust records map to sessions.
- Define replay, downgrade, and blocked-device handling.

Acceptance:

- A design doc names the candidate transport and fallback path.
- The doc explains how trusted devices are authenticated before routing starts.
- Blocked or revoked devices cannot reconnect silently.
- The design leaves room for later encrypted production transport.

### #19 Prepare v0.1.0-beta.4 release checklist

Goal: keep the next beta clean while Milestone 2 introduces routing placeholders and simulators.

Scope:

- Draft beta.4 release notes as work lands.
- Track which features are simulated versus real.
- Verify installers/packages still build.
- Keep beta.3 available as the first clean smoke-test release.

Acceptance:

- Release notes clearly say whether routing, capture, transport, and clipboard are simulated or real.
- Checksums/assets are generated for beta.4 when released.
- Failed drafts do not clutter the Releases page.
