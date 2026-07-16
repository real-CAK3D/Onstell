import { findMonitor, type LayoutEdge, type LayoutProfile, type LayoutRect } from "./layoutModel";
import { canForwardToDevice, type RoutingBlockReason } from "./routingModel";

export type PointerPoint = {
  x: number;
  y: number;
};

export type EdgeDetectionConfig = {
  thresholdPx: number;
  hysteresisPx: number;
};

export type PointerEdgeSide = LayoutEdge["fromSide"];

export type EdgeDetectionResult =
  | {
      type: "local";
      reason: "inside-monitor" | "outside-threshold" | "missing-active-monitor" | "hysteresis";
      activeMonitorId: string | null;
    }
  | {
      type: "target";
      edgeId: string;
      targetDeviceId: string;
      targetMonitorId: string;
      targetEntryPoint: PointerPoint;
    }
  | {
      type: "blocked";
      edgeId: string | null;
      targetDeviceId: string | null;
      targetMonitorId: string | null;
      reason: RoutingBlockReason;
    };

export const defaultEdgeDetectionConfig: EdgeDetectionConfig = {
  thresholdPx: 6,
  hysteresisPx: 12
};

export function detectPointerEdgeCrossing(
  profile: LayoutProfile,
  previous: PointerPoint,
  current: PointerPoint,
  activeMonitorId: string | null = profile.activeMonitorId,
  config: EdgeDetectionConfig = defaultEdgeDetectionConfig
): EdgeDetectionResult {
  if (!activeMonitorId) {
    return { type: "local", reason: "missing-active-monitor", activeMonitorId: null };
  }

  const active = findMonitor(profile, activeMonitorId);
  if (!active) {
    return { type: "local", reason: "missing-active-monitor", activeMonitorId };
  }

  const nearSide = detectNearSide(active.monitor.rect, current, config);
  if (nearSide && !isInsideExpandedRect(previous, active.monitor.rect, config.hysteresisPx)) {
    return { type: "local", reason: "hysteresis", activeMonitorId };
  }

  const side = detectCrossedSide(active.monitor.rect, previous, current, config);
  if (!side) {
    return {
      type: "local",
      reason: isInsideRect(current, active.monitor.rect) ? "inside-monitor" : "outside-threshold",
      activeMonitorId
    };
  }

  const edge = profile.edges.find((candidate) => candidate.fromMonitorId === activeMonitorId && candidate.fromSide === side);
  if (!edge) {
    return { type: "local", reason: "outside-threshold", activeMonitorId };
  }

  const target = findMonitor(profile, edge.toMonitorId);
  if (!target) {
    return { type: "blocked", edgeId: edge.id, targetDeviceId: null, targetMonitorId: edge.toMonitorId, reason: "missing-target" };
  }

  const gate = canForwardToDevice(target.device);
  if (!gate.ok) {
    return {
      type: "blocked",
      edgeId: edge.id,
      targetDeviceId: target.device.id,
      targetMonitorId: target.monitor.id,
      reason: gate.reason
    };
  }

  return {
    type: "target",
    edgeId: edge.id,
    targetDeviceId: target.device.id,
    targetMonitorId: target.monitor.id,
    targetEntryPoint: mapEntryPoint(active.monitor.rect, target.monitor.rect, edge, current, config.hysteresisPx)
  };
}

function detectNearSide(rect: LayoutRect, current: PointerPoint, config: EdgeDetectionConfig): PointerEdgeSide | null {
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  const withinVerticalSpan = current.y >= rect.y && current.y <= bottom;
  const withinHorizontalSpan = current.x >= rect.x && current.x <= right;

  if (withinVerticalSpan && current.x >= right && current.x <= right + config.thresholdPx) return "right";
  if (withinVerticalSpan && current.x <= rect.x && current.x >= rect.x - config.thresholdPx) return "left";
  if (withinHorizontalSpan && current.y <= rect.y && current.y >= rect.y - config.thresholdPx) return "top";
  if (withinHorizontalSpan && current.y >= bottom && current.y <= bottom + config.thresholdPx) return "bottom";
  return null;
}

function detectCrossedSide(
  rect: LayoutRect,
  previous: PointerPoint,
  current: PointerPoint,
  config: EdgeDetectionConfig
): PointerEdgeSide | null {
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  const withinVerticalSpan = current.y >= rect.y && current.y <= bottom;
  const withinHorizontalSpan = current.x >= rect.x && current.x <= right;

  if (withinVerticalSpan && previous.x <= right && current.x >= right && current.x <= right + config.thresholdPx) return "right";
  if (withinVerticalSpan && previous.x >= rect.x && current.x <= rect.x && current.x >= rect.x - config.thresholdPx) return "left";
  if (withinHorizontalSpan && previous.y >= rect.y && current.y <= rect.y && current.y >= rect.y - config.thresholdPx) return "top";
  if (withinHorizontalSpan && previous.y <= bottom && current.y >= bottom && current.y <= bottom + config.thresholdPx) return "bottom";
  return null;
}

function mapEntryPoint(
  sourceRect: LayoutRect,
  targetRect: LayoutRect,
  edge: LayoutEdge,
  current: PointerPoint,
  inset: number
): PointerPoint {
  const sourceHorizontalRatio = clampRatio((current.x - sourceRect.x) / sourceRect.width);
  const sourceVerticalRatio = clampRatio((current.y - sourceRect.y) / sourceRect.height);
  const mappedX = targetRect.x + sourceHorizontalRatio * targetRect.width;
  const mappedY = targetRect.y + sourceVerticalRatio * targetRect.height;

  switch (edge.toSide) {
    case "left":
      return { x: targetRect.x + inset, y: clamp(mappedY, targetRect.y, targetRect.y + targetRect.height) };
    case "right":
      return { x: targetRect.x + targetRect.width - inset, y: clamp(mappedY, targetRect.y, targetRect.y + targetRect.height) };
    case "top":
      return { x: clamp(mappedX, targetRect.x, targetRect.x + targetRect.width), y: targetRect.y + inset };
    case "bottom":
      return { x: clamp(mappedX, targetRect.x, targetRect.x + targetRect.width), y: targetRect.y + targetRect.height - inset };
  }
}

function isInsideRect(point: PointerPoint, rect: LayoutRect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function isInsideExpandedRect(point: PointerPoint, rect: LayoutRect, inset: number) {
  return point.x >= rect.x - inset
    && point.x <= rect.x + rect.width + inset
    && point.y >= rect.y - inset
    && point.y <= rect.y + rect.height + inset;
}

function clampRatio(value: number) {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
