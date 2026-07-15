import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  availabilityLabel,
  findDevice,
  findMonitor,
  type DeviceAvailability,
  type LayoutProfile,
  type OnstellDevice,
  type OnstellMonitor
} from "./layoutModel";
import { loadLayoutProfile, saveLayoutProfile } from "./layoutStorage";
import "./styles.css";

type WidgetSettings = {
  widgetOpacity: number;
  idleOpacity: number;
  hoverOpacity: number;
  layerMode: "always-on-top" | "normal" | "behind" | "summoned";
  locked: boolean;
  rememberPosition: boolean;
  snapToEdge: boolean;
  hideDuringFullscreen: boolean;
};

type WidgetPosition = {
  left: number;
  top: number;
};

type OnstellStatus = {
  activeDevice: string;
  activeMonitor: string;
  latencyMs: number | null;
  seamlessEnabled: boolean;
  connected: boolean;
};

const defaultSettings: Readonly<WidgetSettings> = {
  widgetOpacity: 0.9,
  idleOpacity: 0.6,
  hoverOpacity: 0.95,
  layerMode: "always-on-top",
  locked: false,
  rememberPosition: true,
  snapToEdge: true,
  hideDuringFullscreen: true
};

const fallbackStatus: OnstellStatus = {
  activeDevice: "Main PC",
  activeMonitor: "Display 1",
  latencyMs: 3,
  seamlessEnabled: true,
  connected: false
};

const settingsKey = "onstell.widget.settings";
const positionKey = "onstell.widget.position";
const layoutNudgeStep = 160;
const layerModes: WidgetSettings["layerMode"][] = ["always-on-top", "normal", "behind", "summoned"];

function loadSettings(): WidgetSettings {
  const stored = window.localStorage.getItem(settingsKey);
  if (!stored) return { ...defaultSettings };
  try {
    return normalizeSettings(JSON.parse(stored));
  } catch {
    window.localStorage.removeItem(settingsKey);
    return { ...defaultSettings };
  }
}

function saveSettings(settings: WidgetSettings) {
  window.localStorage.setItem(settingsKey, JSON.stringify(settings));
}

function resetSettings() {
  window.localStorage.removeItem(settingsKey);
  return { ...defaultSettings };
}

function normalizeSettings(value: unknown): WidgetSettings {
  const record = typeof value === "object" && value !== null ? value as Partial<WidgetSettings> : {};
  const layerMode = layerModes.includes(record.layerMode as WidgetSettings["layerMode"])
    ? record.layerMode as WidgetSettings["layerMode"]
    : defaultSettings.layerMode;

  return {
    widgetOpacity: opacityOr(record.widgetOpacity, defaultSettings.widgetOpacity),
    idleOpacity: opacityOr(record.idleOpacity, defaultSettings.idleOpacity),
    hoverOpacity: opacityOr(record.hoverOpacity, defaultSettings.hoverOpacity),
    layerMode,
    locked: booleanOr(record.locked, defaultSettings.locked),
    rememberPosition: booleanOr(record.rememberPosition, defaultSettings.rememberPosition),
    snapToEdge: booleanOr(record.snapToEdge, defaultSettings.snapToEdge),
    hideDuringFullscreen: booleanOr(record.hideDuringFullscreen, defaultSettings.hideDuringFullscreen)
  };
}

function opacityOr(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0.2, value));
}

function booleanOr(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function render(status: OnstellStatus, settings: WidgetSettings, profile: LayoutProfile) {
  const activeDevice = findDevice(profile, profile.activeDeviceId);
  const activeMonitor = findMonitor(profile, profile.activeMonitorId);
  const activeDeviceName = activeDevice?.name ?? status.activeDevice;
  const activeMonitorName = activeMonitor?.monitor.name ?? status.activeMonitor;

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <main class="desktop-shell">
      <section class="tray-preview" aria-label="Tray preview">
        <span>Hidden icons</span>
        <strong>O</strong>
      </section>

      <section class="layout-preview" aria-label="Physical display layout preview">
        ${renderLayoutPreview(profile)}
      </section>

      <section class="widget" data-menu-open="false" data-idle="false" data-locked="${settings.locked}" aria-label="Onstell floating widget">
        <div class="widget-main" data-drag-handle="true">
          <div class="logo" aria-hidden="true">O</div>
          <div class="copy">
            <div class="eyebrow"><span class="dot ${status.connected ? "is-online" : "is-placeholder"}"></span>Device Desktop mode</div>
            <div class="title">Onstell</div>
            <div class="subline">${escapeHtml(activeDeviceName)} active - ${escapeHtml(activeMonitorName)} - ${status.connected ? "connected" : "placeholder state"}</div>
          </div>
          <div class="actions">
            <button class="pill" type="button" data-toggle-seamless>${status.seamlessEnabled ? "Enabled" : "Disabled"}</button>
            <button class="icon" type="button" aria-label="Disconnect" data-disconnect>X</button>
            <button class="icon" type="button" aria-label="Open widget settings" data-settings>Cog</button>
          </div>
        </div>

        <div class="metrics">
          <article><span>Profile</span><strong>${escapeHtml(profile.name)}</strong></article>
          <article><span>Latency</span><strong>${status.latencyMs === null ? "N/A" : `${status.latencyMs} ms`}</strong></article>
          <article><span>Layer</span><strong data-layer-label>${labelForLayer(settings.layerMode)}</strong></article>
        </div>

        <div class="settings-panel" role="dialog" aria-label="Quick widget settings">
          <header>
            <div>
              <strong>Quick settings</strong>
              <span>Glass, layer and position</span>
            </div>
            <button class="icon" type="button" aria-label="Close settings" data-close>X</button>
          </header>

          ${slider("Widget", "widgetOpacity", settings.widgetOpacity)}
          ${slider("Idle", "idleOpacity", settings.idleOpacity)}
          ${slider("Hover", "hoverOpacity", settings.hoverOpacity)}

          <div class="mode-grid" aria-label="Window layer mode">
            ${modeButton("always-on-top", settings.layerMode, "Always on top")}
            ${modeButton("normal", settings.layerMode, "Normal level")}
            ${modeButton("behind", settings.layerMode, "Behind windows")}
            ${modeButton("summoned", settings.layerMode, "Summoned only")}
          </div>

          ${toggle("Lock widget position", "locked", settings.locked)}
          ${toggle("Remember widget position", "rememberPosition", settings.rememberPosition)}
          ${toggle("Snap to screen edge", "snapToEdge", settings.snapToEdge)}
          ${toggle("Hide during full-screen apps", "hideDuringFullscreen", settings.hideDuringFullscreen)}

          <div class="settings-actions">
            <button class="pill" type="button" data-reset-position>Reset position</button>
            <button class="pill danger" type="button" data-reset-settings>Reset widget</button>
          </div>

          ${renderLayoutEditor(profile)}
        </div>
      </section>
    </main>
  `;
}

function renderLayoutPreview(profile: LayoutProfile) {
  const tiles = getMonitorTiles(profile);
  return `
    <div class="layout-map">
      ${tiles.map(({ device, monitor, left, top, width, height }) => renderMonitorCard(profile, device, monitor, left, top, width, height)).join("")}
    </div>
  `;
}

function renderMonitorCard(
  profile: LayoutProfile,
  device: OnstellDevice,
  monitor: OnstellMonitor,
  left: number,
  top: number,
  width: number,
  height: number
) {
  const isActive = profile.activeMonitorId === monitor.id;
  const isPrimary = monitor.role === "primary" || device.role === "controller";
  return `
    <div class="display-card ${isPrimary ? "is-primary" : ""} ${isActive ? "is-active" : ""} ${device.availability === "offline" ? "is-offline" : ""}"
      style="--monitor-color: ${monitor.color}; --tile-left: ${left}%; --tile-top: ${top}%; --tile-width: ${width}%; --tile-height: ${height}%">
      <strong>${escapeHtml(monitor.name)}</strong>
      <span>${escapeHtml(device.name)} - ${availabilityLabel(device.availability)}</span>
    </div>
  `;
}

function renderLayoutEditor(profile: LayoutProfile) {
  const selectedDevice = findDevice(profile, profile.activeDeviceId) ?? profile.devices[0];
  const selectedMonitor = findMonitor(profile, profile.activeMonitorId)?.monitor ?? selectedDevice?.monitors[0];

  if (!selectedDevice || !selectedMonitor) return "";

  return `
    <section class="layout-editor" aria-label="Manual layout editor">
      <header>
        <div>
          <strong>Layout editor</strong>
          <span>${profile.devices.length} devices - ${profile.devices.flatMap((device) => device.monitors).length} monitors</span>
        </div>
        <button class="pill" type="button" data-add-device>Add</button>
      </header>

      <label class="field-row">
        <span>Device</span>
        <select data-layout-device>
          ${profile.devices.map((device) => `<option value="${escapeHtml(device.id)}" ${device.id === selectedDevice.id ? "selected" : ""}>${escapeHtml(device.name)}</option>`).join("")}
        </select>
      </label>

      <label class="field-row">
        <span>Name</span>
        <input type="text" value="${escapeHtml(selectedDevice.name)}" data-layout-device-name>
      </label>

      <label class="field-row">
        <span>Status</span>
        <select data-layout-availability>
          ${(["local", "available", "offline", "blocked", "unknown"] satisfies DeviceAvailability[]).map((availability) => (
            `<option value="${availability}" ${availability === selectedDevice.availability ? "selected" : ""}>${availabilityLabel(availability)}</option>`
          )).join("")}
        </select>
      </label>

      <label class="field-row">
        <span>Monitor</span>
        <select data-layout-monitor>
          ${selectedDevice.monitors.map((monitor) => `<option value="${escapeHtml(monitor.id)}" ${monitor.id === selectedMonitor.id ? "selected" : ""}>${escapeHtml(monitor.name)}</option>`).join("")}
        </select>
      </label>

      <label class="field-row">
        <span>Label</span>
        <input type="text" value="${escapeHtml(selectedMonitor.name)}" data-layout-monitor-name>
      </label>

      <div class="nudge-grid" aria-label="Move selected monitor">
        <span>${selectedMonitor.rect.x}, ${selectedMonitor.rect.y}</span>
        <button class="icon" type="button" data-nudge-x="0" data-nudge-y="-${layoutNudgeStep}" aria-label="Move monitor up">Up</button>
        <button class="icon" type="button" data-nudge-x="-${layoutNudgeStep}" data-nudge-y="0" aria-label="Move monitor left">Left</button>
        <button class="icon" type="button" data-nudge-x="${layoutNudgeStep}" data-nudge-y="0" aria-label="Move monitor right">Right</button>
        <button class="icon" type="button" data-nudge-x="0" data-nudge-y="${layoutNudgeStep}" aria-label="Move monitor down">Down</button>
      </div>

      <button class="pill danger" type="button" data-remove-device ${profile.devices.length <= 1 ? "disabled" : ""}>Remove selected device</button>
    </section>
  `;
}

function getMonitorTiles(profile: LayoutProfile) {
  const monitors = profile.devices.flatMap((device) => device.monitors.map((monitor) => ({ device, monitor })));
  const minX = Math.min(...monitors.map(({ monitor }) => monitor.rect.x));
  const minY = Math.min(...monitors.map(({ monitor }) => monitor.rect.y));
  const maxX = Math.max(...monitors.map(({ monitor }) => monitor.rect.x + monitor.rect.width));
  const maxY = Math.max(...monitors.map(({ monitor }) => monitor.rect.y + monitor.rect.height));
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  return monitors.map(({ device, monitor }) => ({
    device,
    monitor,
    left: ((monitor.rect.x - minX) / spanX) * 100,
    top: ((monitor.rect.y - minY) / spanY) * 100,
    width: (monitor.rect.width / spanX) * 100,
    height: (monitor.rect.height / spanY) * 100
  }));
}

function slider(label: string, key: keyof WidgetSettings, value: number) {
  return `
    <label class="slider-row">
      <span>${label}</span>
      <input type="range" min="20" max="100" value="${Math.round(Number(value) * 100)}" data-setting="${key}">
      <output>${Math.round(Number(value) * 100)}%</output>
    </label>
  `;
}

function toggle(label: string, key: keyof WidgetSettings, value: boolean) {
  return `
    <label class="toggle-row">
      <span>${label}</span>
      <input type="checkbox" data-setting="${key}" ${value ? "checked" : ""}>
    </label>
  `;
}

function modeButton(mode: WidgetSettings["layerMode"], selected: WidgetSettings["layerMode"], label: string) {
  return `<button class="pill" type="button" data-layer="${mode}" aria-pressed="${mode === selected}">${label}</button>`;
}

function labelForLayer(mode: WidgetSettings["layerMode"]) {
  const labels: Record<WidgetSettings["layerMode"], string> = {
    "always-on-top": "Always on top",
    normal: "Normal level",
    behind: "Behind windows",
    summoned: "Summoned only"
  };
  return labels[mode];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pickDeviceColor(index: number) {
  const colors = ["#35d6ff", "#ffd166", "#ff6aa9", "#22c55e", "#f97316", "#a78bfa"];
  return colors[index % colors.length];
}

function applySettings(settings: WidgetSettings) {
  const root = document.documentElement;
  root.style.setProperty("--widget-opacity", String(settings.widgetOpacity));
  root.style.setProperty("--idle-opacity", String(settings.idleOpacity));
  root.style.setProperty("--hover-opacity", String(settings.hoverOpacity));
  document.querySelector<HTMLElement>(".widget")?.setAttribute("data-locked", String(settings.locked));
  document.querySelector<HTMLElement>("[data-layer-label]")!.textContent = labelForLayer(settings.layerMode);
}

async function applyNativeLayer(settings: WidgetSettings) {
  const current = getCurrentWindow();
  try {
    await current.setAlwaysOnTop(settings.layerMode === "always-on-top");
  } catch {
    // The web preview cannot apply native window levels.
  }
}

async function getStatus(): Promise<OnstellStatus> {
  try {
    return await invoke<OnstellStatus>("get_status");
  } catch {
    return fallbackStatus;
  }
}

function wireInteractions(settings: WidgetSettings, profile: LayoutProfile, status: OnstellStatus) {
  const widget = document.querySelector<HTMLElement>(".widget")!;
  const desktop = document.querySelector<HTMLElement>(".desktop-shell")!;
  const rerenderWidget = async (menuOpen = true) => {
    render(status, settings, profile);
    applySettings(settings);
    await applyNativeLayer(settings);
    wireInteractions(settings, profile, status);
    document.querySelector<HTMLElement>(".widget")!.dataset.menuOpen = String(menuOpen);
  };
  const rerenderForLayoutChange = () => {
    saveLayoutProfile(profile);
    render(status, settings, profile);
    applySettings(settings);
    wireInteractions(settings, profile, status);
    document.querySelector<HTMLElement>(".widget")!.dataset.menuOpen = "true";
  };

  document.querySelector<HTMLElement>("[data-settings]")!.addEventListener("click", () => {
    widget.dataset.menuOpen = widget.dataset.menuOpen === "true" ? "false" : "true";
  });

  document.querySelector<HTMLElement>("[data-close]")!.addEventListener("click", () => {
    widget.dataset.menuOpen = "false";
  });

  document.querySelectorAll<HTMLInputElement>("[data-setting]").forEach((control) => {
    control.addEventListener("input", async () => {
      const key = control.dataset.setting as keyof WidgetSettings;
      const nextValue = control.type === "checkbox" ? control.checked : Number(control.value) / 100;
      const next = { ...settings, [key]: nextValue } as WidgetSettings;
      Object.assign(settings, next);
      if (control.nextElementSibling instanceof HTMLOutputElement) {
        control.nextElementSibling.value = `${control.value}%`;
      }
      saveSettings(settings);
      applySettings(settings);
      await applyNativeLayer(settings);
    });
  });

  document.querySelector<HTMLButtonElement>("[data-reset-settings]")?.addEventListener("click", async () => {
    Object.assign(settings, resetSettings());
    await rerenderWidget(true);
  });

  document.querySelector<HTMLButtonElement>("[data-reset-position]")?.addEventListener("click", () => {
    resetWidgetPosition(widget);
  });

  document.querySelectorAll<HTMLButtonElement>("[data-layer]").forEach((button) => {
    button.addEventListener("click", async () => {
      settings.layerMode = button.dataset.layer as WidgetSettings["layerMode"];
      saveSettings(settings);
      document.querySelectorAll<HTMLButtonElement>("[data-layer]").forEach((peer) => {
        peer.setAttribute("aria-pressed", String(peer === button));
      });
      applySettings(settings);
      await applyNativeLayer(settings);
    });
  });

  document.querySelector<HTMLSelectElement>("[data-layout-device]")?.addEventListener("change", (event) => {
    const deviceId = (event.currentTarget as HTMLSelectElement).value;
    const device = findDevice(profile, deviceId);
    if (!device) return;
    profile.activeDeviceId = device.id;
    profile.activeMonitorId = device.monitors[0]?.id ?? profile.activeMonitorId;
    rerenderForLayoutChange();
  });

  document.querySelector<HTMLInputElement>("[data-layout-device-name]")?.addEventListener("change", (event) => {
    const device = findDevice(profile, profile.activeDeviceId);
    if (!device) return;
    device.name = (event.currentTarget as HTMLInputElement).value.trim() || device.name;
    rerenderForLayoutChange();
  });

  document.querySelector<HTMLSelectElement>("[data-layout-availability]")?.addEventListener("change", (event) => {
    const device = findDevice(profile, profile.activeDeviceId);
    if (!device) return;
    device.availability = (event.currentTarget as HTMLSelectElement).value as DeviceAvailability;
    rerenderForLayoutChange();
  });

  document.querySelector<HTMLSelectElement>("[data-layout-monitor]")?.addEventListener("change", (event) => {
    profile.activeMonitorId = (event.currentTarget as HTMLSelectElement).value;
    rerenderForLayoutChange();
  });

  document.querySelector<HTMLInputElement>("[data-layout-monitor-name]")?.addEventListener("change", (event) => {
    const selection = findMonitor(profile, profile.activeMonitorId);
    if (!selection) return;
    selection.monitor.name = (event.currentTarget as HTMLInputElement).value.trim() || selection.monitor.name;
    rerenderForLayoutChange();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-nudge-x][data-nudge-y]").forEach((button) => {
    button.addEventListener("click", () => {
      const selection = findMonitor(profile, profile.activeMonitorId);
      if (!selection) return;
      selection.monitor.rect.x += Number(button.dataset.nudgeX);
      selection.monitor.rect.y += Number(button.dataset.nudgeY);
      rerenderForLayoutChange();
    });
  });

  document.querySelector<HTMLButtonElement>("[data-add-device]")?.addEventListener("click", () => {
    const index = profile.devices.length + 1;
    const id = `manual-device-${crypto.randomUUID()}`;
    const monitorId = `${id}-monitor`;
    const offset = index * layoutNudgeStep;
    profile.devices.push({
      id,
      name: `Manual Device ${index}`,
      role: "follower",
      availability: "unknown",
      lastSeen: null,
      monitors: [
        {
          id: monitorId,
          name: "Display 1",
          role: "secondary",
          rect: { x: offset, y: offset, width: 1920, height: 1080 },
          scale: 1,
          color: pickDeviceColor(index)
        }
      ]
    });
    profile.activeDeviceId = id;
    profile.activeMonitorId = monitorId;
    rerenderForLayoutChange();
  });

  document.querySelector<HTMLButtonElement>("[data-remove-device]")?.addEventListener("click", () => {
    if (profile.devices.length <= 1) return;
    const index = profile.devices.findIndex((device) => device.id === profile.activeDeviceId);
    if (index < 0) return;
    profile.devices.splice(index, 1);
    const nextDevice = profile.devices[Math.max(0, index - 1)] ?? profile.devices[0];
    profile.activeDeviceId = nextDevice.id;
    profile.activeMonitorId = nextDevice.monitors[0]?.id ?? profile.activeMonitorId;
    rerenderForLayoutChange();
  });

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let widgetX = 0;
  let widgetY = 0;

  restoreWidgetPosition(widget, desktop, settings);

  widget.addEventListener("pointerdown", (event) => {
    if (settings.locked || event.target instanceof HTMLElement && event.target.closest("button, input, label")) return;
    dragging = true;
    const parent = desktop.getBoundingClientRect();
    const rect = widget.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    widgetX = rect.left - parent.left;
    widgetY = rect.top - parent.top;
    widget.style.left = `${widgetX}px`;
    widget.style.top = `${widgetY}px`;
    widget.style.right = "auto";
    widget.style.bottom = "auto";
    widget.setPointerCapture(event.pointerId);
  });

  widget.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const parent = desktop.getBoundingClientRect();
    const rect = widget.getBoundingClientRect();
    const left = Math.min(Math.max(8, widgetX + event.clientX - startX), parent.width - rect.width - 8);
    const top = Math.min(Math.max(8, widgetY + event.clientY - startY), parent.height - rect.height - 8);
    widget.style.left = `${left}px`;
    widget.style.top = `${top}px`;
  });

  widget.addEventListener("pointerup", (event) => {
    if (!dragging) return;
    dragging = false;
    if (widget.hasPointerCapture(event.pointerId)) widget.releasePointerCapture(event.pointerId);
    if (settings.rememberPosition) {
      saveWidgetPosition({
        left: Number.parseFloat(widget.style.left),
        top: Number.parseFloat(widget.style.top)
      });
    }
  });
}

function restoreWidgetPosition(widget: HTMLElement, desktop: HTMLElement, settings: WidgetSettings) {
  if (!settings.rememberPosition) {
    window.localStorage.removeItem(positionKey);
    return;
  }

  const storedPosition = window.localStorage.getItem(positionKey);
  if (!storedPosition) return;

  try {
    const position = normalizeWidgetPosition(JSON.parse(storedPosition));
    if (!position) {
      window.localStorage.removeItem(positionKey);
      return;
    }
    const bounded = boundWidgetPosition(position, widget, desktop);
    applyWidgetPosition(widget, bounded);
    saveWidgetPosition(bounded);
  } catch {
    window.localStorage.removeItem(positionKey);
  }
}

function normalizeWidgetPosition(value: unknown): WidgetPosition | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Partial<WidgetPosition>;
  if (typeof candidate.left !== "number" || typeof candidate.top !== "number") return null;
  if (!Number.isFinite(candidate.left) || !Number.isFinite(candidate.top)) return null;
  return { left: candidate.left, top: candidate.top };
}

function boundWidgetPosition(position: WidgetPosition, widget: HTMLElement, desktop: HTMLElement): WidgetPosition {
  const parent = desktop.getBoundingClientRect();
  const rect = widget.getBoundingClientRect();
  return {
    left: Math.min(Math.max(8, position.left), Math.max(8, parent.width - rect.width - 8)),
    top: Math.min(Math.max(8, position.top), Math.max(8, parent.height - rect.height - 8))
  };
}

function applyWidgetPosition(widget: HTMLElement, position: WidgetPosition) {
  widget.style.left = `${position.left}px`;
  widget.style.top = `${position.top}px`;
  widget.style.right = "auto";
  widget.style.bottom = "auto";
}

function saveWidgetPosition(position: WidgetPosition) {
  window.localStorage.setItem(positionKey, JSON.stringify(position));
}

function resetWidgetPosition(widget: HTMLElement) {
  window.localStorage.removeItem(positionKey);
  widget.style.left = "";
  widget.style.top = "";
  widget.style.right = "";
  widget.style.bottom = "";
}

async function boot() {
  const settings = loadSettings();
  const profile = loadLayoutProfile();
  const status = await getStatus();
  render(status, settings, profile);
  applySettings(settings);
  await applyNativeLayer(settings);
  wireInteractions(settings, profile, status);
}

void boot();
