export type PeerTrustState = "unpaired" | "pending" | "trusted" | "blocked" | "revoked";

export type IdentityMaterialStatus = "not-created";

export type LocalIdentityPrototype = {
  deviceId: string;
  deviceName: string;
  createdAt: string;
  publicIdentityFingerprint: string | null;
  materialStatus: IdentityMaterialStatus;
  storageScope: "local-only-fake";
};

export type ProtocolVersionRange = {
  minimum: number;
  maximum: number;
};

export type PeerTrustRecord = {
  peerDeviceId: string;
  displayName: string;
  nickname: string | null;
  publicIdentityFingerprint: string | null;
  trustState: PeerTrustState;
  firstTrustedAt: string | null;
  lastSeenAt: string | null;
  blockedAt: string | null;
  revokedAt: string | null;
  recoveryRequired: boolean;
  protocolVersions: ProtocolVersionRange;
  updatedAt: string;
};

export type TrustTransitionOptions = {
  explicitUserAction?: boolean;
};

export type TrustTransitionBlockedReason =
  | "blocked-peer-requires-explicit-repair"
  | "revoked-peer-requires-explicit-recovery";

export type TrustTransitionResult =
  | { ok: true; record: PeerTrustRecord }
  | { ok: false; reason: TrustTransitionBlockedReason; record: PeerTrustRecord };

export type PeerSessionGate =
  | { ok: true; record: PeerTrustRecord }
  | { ok: false; reason: "missing-record" | "unpaired-peer" | "pending-peer" | "blocked-peer" | "revoked-peer" };

export const defaultProtocolVersions: ProtocolVersionRange = {
  minimum: 1,
  maximum: 1
};

export function createLocalIdentityPrototype(
  deviceId: string,
  deviceName: string,
  now = new Date().toISOString()
): LocalIdentityPrototype {
  return {
    deviceId,
    deviceName,
    createdAt: now,
    publicIdentityFingerprint: null,
    materialStatus: "not-created",
    storageScope: "local-only-fake"
  };
}

export function createPeerTrustRecord(
  peerDeviceId: string,
  displayName: string,
  now = new Date().toISOString()
): PeerTrustRecord {
  return {
    peerDeviceId,
    displayName,
    nickname: null,
    publicIdentityFingerprint: null,
    trustState: "unpaired",
    firstTrustedAt: null,
    lastSeenAt: null,
    blockedAt: null,
    revokedAt: null,
    recoveryRequired: false,
    protocolVersions: { ...defaultProtocolVersions },
    updatedAt: now
  };
}

export function transitionPeerTrustRecord(
  record: PeerTrustRecord,
  nextState: PeerTrustState,
  now = new Date().toISOString(),
  options: TrustTransitionOptions = {}
): TrustTransitionResult {
  if (record.trustState === "blocked" && nextState !== "blocked" && !options.explicitUserAction) {
    return { ok: false, reason: "blocked-peer-requires-explicit-repair", record: clonePeerTrustRecord(record) };
  }

  if (record.trustState === "revoked" && nextState !== "revoked" && !options.explicitUserAction) {
    return { ok: false, reason: "revoked-peer-requires-explicit-recovery", record: clonePeerTrustRecord(record) };
  }

  const next: PeerTrustRecord = {
    ...clonePeerTrustRecord(record),
    trustState: nextState,
    updatedAt: now,
    blockedAt: nextState === "blocked" ? now : record.blockedAt,
    revokedAt: nextState === "revoked" ? now : record.revokedAt,
    recoveryRequired: nextState === "blocked" || nextState === "revoked"
  };

  if (nextState === "trusted" && !next.firstTrustedAt) {
    next.firstTrustedAt = now;
  }

  if (options.explicitUserAction && (record.trustState === "blocked" || record.trustState === "revoked")) {
    next.recoveryRequired = nextState === "blocked" || nextState === "revoked";
  }

  return { ok: true, record: next };
}

export function markPeerSeen(record: PeerTrustRecord, now = new Date().toISOString()): PeerTrustRecord {
  return {
    ...clonePeerTrustRecord(record),
    lastSeenAt: now,
    updatedAt: now
  };
}

export function canPeerStartSession(record: PeerTrustRecord | null): PeerSessionGate {
  if (!record) return { ok: false, reason: "missing-record" };
  switch (record.trustState) {
    case "trusted":
      return { ok: true, record };
    case "pending":
      return { ok: false, reason: "pending-peer" };
    case "blocked":
      return { ok: false, reason: "blocked-peer" };
    case "revoked":
      return { ok: false, reason: "revoked-peer" };
    case "unpaired":
      return { ok: false, reason: "unpaired-peer" };
  }
}

export function normalizePeerTrustRecord(value: unknown, now = new Date().toISOString()): PeerTrustRecord | null {
  if (!isRecord(value)) return null;
  const peerDeviceId = stringOr(value.peerDeviceId, "");
  if (!peerDeviceId) return null;

  return {
    peerDeviceId,
    displayName: stringOr(value.displayName, "Unnamed peer"),
    nickname: typeof value.nickname === "string" && value.nickname.trim().length > 0 ? value.nickname : null,
    publicIdentityFingerprint: typeof value.publicIdentityFingerprint === "string" && value.publicIdentityFingerprint.trim().length > 0
      ? value.publicIdentityFingerprint
      : null,
    trustState: trustStateOr(value.trustState),
    firstTrustedAt: typeof value.firstTrustedAt === "string" ? value.firstTrustedAt : null,
    lastSeenAt: typeof value.lastSeenAt === "string" ? value.lastSeenAt : null,
    blockedAt: typeof value.blockedAt === "string" ? value.blockedAt : null,
    revokedAt: typeof value.revokedAt === "string" ? value.revokedAt : null,
    recoveryRequired: typeof value.recoveryRequired === "boolean" ? value.recoveryRequired : value.trustState === "blocked" || value.trustState === "revoked",
    protocolVersions: normalizeProtocolVersions(value.protocolVersions),
    updatedAt: stringOr(value.updatedAt, now)
  };
}

function clonePeerTrustRecord(record: PeerTrustRecord): PeerTrustRecord {
  return {
    ...record,
    protocolVersions: { ...record.protocolVersions }
  };
}

function normalizeProtocolVersions(value: unknown): ProtocolVersionRange {
  if (!isRecord(value)) return { ...defaultProtocolVersions };
  return {
    minimum: positiveIntegerOr(value.minimum, defaultProtocolVersions.minimum),
    maximum: positiveIntegerOr(value.maximum, defaultProtocolVersions.maximum)
  };
}

function trustStateOr(value: unknown): PeerTrustState {
  if (value === "pending" || value === "trusted" || value === "blocked" || value === "revoked") return value;
  return "unpaired";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function positiveIntegerOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}
