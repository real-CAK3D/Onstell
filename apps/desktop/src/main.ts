import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { availabilityLabel, findDevice, findMonitor, type LayoutProfile, type OnstellDevice, type OnstellMonitor } from "./layoutModel";
import { loadLayoutProfile } from "./layoutStorage";
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

function loadSettings(): WidgetSettings {
  const stored = window.localStorage.getItem(settingsKey);
  if (!stored) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(stored) } as WidgetSettings;
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: WidgetSettings) {
  window.localStorage.setItem(settingsKey, JSON.stringify(settings));
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
        </div>
      </section>
    </main>
  `;
}

function renderLayoutPreview(profile: LayoutProfile) {
  return profile.devices.map((device) => `
    <article class="device-card ${device.availability === "offline" ? "is-offline" : ""}" data-device-role="${device.role}">
      <header>
        <strong>${escapeHtml(device.name)}</strong>
        <span>${availabilityLabel(device.availability)}</span>
      </header>
      <div class="monitor-stack">
        ${device.monitors.map((monitor) => renderMonitorCard(profile, device, monitor)).join("")}
      </div>
    </article>
  `).join("");
}

function renderMonitorCard(profile: LayoutProfile, device: OnstellDevice, monitor: OnstellMonitor) {
  const isActive = profile.activeMonitorId === monitor.id;
  const isPrimary = monitor.role === "primary" || device.role === "controller";
  return `
    <div class="display-card ${isPrimary ? "is-primary" : ""} ${isActive ? "is-active" : ""}" style="--monitor-color: ${monitor.color}">
      <strong>${escapeHtml(monitor.name)}</strong>
      <span>${monitor.rect.width} x ${monitor.rect.height}</span>
    </div>
  `;
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

function wireInteractions(settings: WidgetSettings) {
  const widget = document.querySelector<HTMLElement>(".widget")!;
  const desktop = document.querySelector<HTMLElement>(".desktop-shell")!;

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

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let widgetX = 0;
  let widgetY = 0;

  const storedPosition = window.localStorage.getItem(positionKey);
  if (storedPosition) {
    try {
      const position = JSON.parse(storedPosition) as { left: number; top: number };
      widget.style.left = `${position.left}px`;
      widget.style.top = `${position.top}px`;
      widget.style.right = "auto";
      widget.style.bottom = "auto";
    } catch {
      window.localStorage.removeItem(positionKey);
    }
  }

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
      window.localStorage.setItem(positionKey, JSON.stringify({
        left: Number.parseFloat(widget.style.left),
        top: Number.parseFloat(widget.style.top)
      }));
    }
  });
}

async function boot() {
  const settings = loadSettings();
  const profile = loadLayoutProfile();
  const status = await getStatus();
  render(status, settings, profile);
  applySettings(settings);
  await applyNativeLayer(settings);
  wireInteractions(settings);
}

void boot();
