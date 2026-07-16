# Loopback Follower Simulator

The loopback follower simulator exercises controller/follower state inside the desktop app before LAN transport or OS injection exists.

It is explicitly fake:

- No keyboard APIs.
- No pointer APIs.
- No clipboard APIs.
- No sockets, LAN discovery, or remote sessions.
- No input suppression or injection.

## Behavior

The simulator receives normalized fake events from the widget dev panel:

- Connect to a trusted available follower from the local layout profile.
- Receive fake key, pointer-button, and pointer-delta events.
- Track fake held key and pointer-button state.
- Change from one trusted target to another.
- Release fake held state on the Release action or native input-released event.

The simulator uses the same trust gate as the routing model. Unpaired, pending, blocked, offline, unknown, local, controller, or missing targets cannot receive simulated events.

## Manual Check

1. Open the widget settings panel.
2. In Loopback follower, choose Trust fake Pi.
3. Choose Connect.
4. Choose Send fake input.
5. Confirm the event count increases and held state is nonzero.
6. Choose Release.
7. Confirm held state returns to zero and the simulator is idle.

Use Target HP to verify trusted target changes. Target changes clear held state before the new fake target becomes active.
