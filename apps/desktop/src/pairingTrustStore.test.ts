import {
  canPeerStartSession,
  createLocalIdentityPrototype,
  createPeerTrustRecord,
  markPeerSeen,
  normalizePeerTrustRecord,
  transitionPeerTrustRecord
} from "./pairingTrustStore";

type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [
  {
    name: "local identity prototype creates no crypto material",
    run: () => {
      const identity = createLocalIdentityPrototype("main-pc", "Main PC", "2026-07-16T00:00:00.000Z");
      assertEqual(identity.deviceId, "main-pc");
      assertEqual(identity.publicIdentityFingerprint, null);
      assertEqual(identity.materialStatus, "not-created");
      assertEqual(identity.storageScope, "local-only-fake");
    }
  },
  {
    name: "trusted peer records preserve first trusted timestamp",
    run: () => {
      const pending = transitionPeerTrustRecord(createPeerTrustRecord("pi", "Raspberry Pi", "2026-07-16T00:00:00.000Z"), "pending", "2026-07-16T00:01:00.000Z");
      assertEqual(pending.ok, true);
      if (!pending.ok) return;
      const trusted = transitionPeerTrustRecord(pending.record, "trusted", "2026-07-16T00:02:00.000Z");
      assertEqual(trusted.ok, true);
      if (!trusted.ok) return;
      assertEqual(trusted.record.firstTrustedAt, "2026-07-16T00:02:00.000Z");
      const seen = markPeerSeen(trusted.record, "2026-07-16T00:03:00.000Z");
      assertEqual(seen.lastSeenAt, "2026-07-16T00:03:00.000Z");
    }
  },
  {
    name: "blocked peer cannot silently return to trusted",
    run: () => {
      const blocked = transitionPeerTrustRecord(createPeerTrustRecord("pi", "Raspberry Pi"), "blocked", "2026-07-16T00:04:00.000Z");
      assertEqual(blocked.ok, true);
      if (!blocked.ok) return;
      const silentTrust = transitionPeerTrustRecord(blocked.record, "trusted", "2026-07-16T00:05:00.000Z");
      assertEqual(silentTrust.ok, false);
      if (silentTrust.ok) return;
      assertEqual(silentTrust.reason, "blocked-peer-requires-explicit-repair");
      assertEqual(silentTrust.record.trustState, "blocked");
    }
  },
  {
    name: "revoked peer cannot silently return to pending or trusted",
    run: () => {
      const revoked = transitionPeerTrustRecord(createPeerTrustRecord("laptop", "HP Laptop"), "revoked", "2026-07-16T00:06:00.000Z");
      assertEqual(revoked.ok, true);
      if (!revoked.ok) return;
      const silentPending = transitionPeerTrustRecord(revoked.record, "pending", "2026-07-16T00:07:00.000Z");
      assertEqual(silentPending.ok, false);
      if (silentPending.ok) return;
      assertEqual(silentPending.reason, "revoked-peer-requires-explicit-recovery");

      const explicitRepair = transitionPeerTrustRecord(revoked.record, "pending", "2026-07-16T00:08:00.000Z", { explicitUserAction: true });
      assertEqual(explicitRepair.ok, true);
      if (explicitRepair.ok) assertEqual(explicitRepair.record.trustState, "pending");
    }
  },
  {
    name: "session gate only allows trusted records",
    run: () => {
      const unpaired = createPeerTrustRecord("pi", "Raspberry Pi");
      assertEqual(canPeerStartSession(unpaired).ok, false);
      const trusted = transitionPeerTrustRecord(unpaired, "trusted", "2026-07-16T00:09:00.000Z");
      assertEqual(trusted.ok, true);
      if (trusted.ok) assertEqual(canPeerStartSession(trusted.record).ok, true);
      const blocked = transitionPeerTrustRecord(unpaired, "blocked", "2026-07-16T00:10:00.000Z");
      assertEqual(blocked.ok, true);
      if (blocked.ok) {
        const gate = canPeerStartSession(blocked.record);
        assertEqual(gate.ok, false);
        if (!gate.ok) assertEqual(gate.reason, "blocked-peer");
      }
    }
  },
  {
    name: "normalizes persisted records without private keys",
    run: () => {
      const normalized = normalizePeerTrustRecord({
        peerDeviceId: "pi",
        displayName: "Raspberry Pi",
        trustState: "revoked",
        protocolVersions: { minimum: 1, maximum: 2 },
        privateIdentityKey: "must-not-survive"
      });
      assert(normalized !== null, "record should normalize");
      if (!normalized) return;
      assertEqual(normalized.trustState, "revoked");
      assertEqual(normalized.recoveryRequired, true);
      assertEqual("privateIdentityKey" in normalized, false);
    }
  }
];

export function runPairingTrustStoreTests() {
  for (const test of tests) {
    test.run();
  }
  return tests.length;
}

function assertEqual<T>(actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}
