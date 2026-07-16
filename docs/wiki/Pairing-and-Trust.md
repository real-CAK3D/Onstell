# Pairing and Trust

Onstell must treat input forwarding as a privileged action. A discovered device is not allowed to receive keyboard, pointer, clipboard, or file-transfer data until it has been explicitly trusted.

## Pairing States

- `local`: the current controller device. This state is assigned by the local app and is not selectable for remote devices.
- `unpaired`: a discovered or manually added device that has no trust relationship yet.
- `pending`: a pairing request has been started, but the user has not confirmed the same code on both machines.
- `trusted`: the device is allowed to participate in future input, clipboard, and layout workflows.
- `blocked`: the device must not receive control traffic and should be hidden from automatic reconnect flows.
- `revoked`: a previously trusted device has lost trust and must not reconnect without an explicit recovery or re-pairing action.

## First Milestone Placeholder Flow

The current desktop shell only models the flow:

1. Discovery lists local/manual devices and fake nearby devices.
2. A user can mark a device as pending, trusted, or blocked in the layout editor.
3. Blocked devices are visually marked and should stay blocked across profile saves.
4. Trusted devices may be used by later input-routing prototypes.

No real network pairing, cryptographic key exchange, input forwarding, or clipboard sync is implemented yet.

Milestone 3 adds `apps/desktop/src/pairingTrustStore.ts` as a local-only prototype for identity and peer trust records. It stores fake identity metadata, peer ids, display names, optional public identity fingerprints, trust state, first-trusted and last-seen timestamps, protocol version expectations, and blocked/revoked recovery flags. It does not create private keys, sockets, pairing exchanges, nonces, session keys, encrypted frames, or real crypto material.

## Future Real Pairing Flow

1. Device A discovers Device B on the local network.
2. Both devices show a short human-verifiable pairing code.
3. The user confirms the code on both devices.
4. Each device stores the other device's public identity key and a local trust record.
5. Sessions use authenticated encrypted transport.
6. Trust can be revoked locally at any time.

See [Pairing Session Transport](Pairing-Session-Transport) for the first LAN session shape, handshake expectations, reconnect rules, and blocked-device behavior.

## Minimum Device Identity

A future trusted device record should include:

- Stable device id.
- User-visible device name.
- Public identity key fingerprint.
- First trusted timestamp.
- Last seen timestamp.
- Trust state.
- Optional local nickname.

Blocked and revoked records must persist as local decisions. They cannot move back to pending or trusted through discovery or reconnect alone; the local user must take an explicit recovery or re-pairing action.

## Safety Rules

- Never forward input to an unpaired, pending, or blocked device.
- Never auto-trust a discovered device.
- Rejected or blocked devices stay blocked until the user changes the state.
- A pairing code must be short enough to compare manually but strong enough to detect local spoofing attempts.
- Disconnect must release held keys and pointer buttons.
- Emergency release must work even when the active remote device is misbehaving.
- Blocked or revoked devices must not reconnect silently.
