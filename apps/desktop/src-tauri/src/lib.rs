use serde::Serialize;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, PhysicalPosition,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OnstellStatus {
    active_device: String,
    active_monitor: String,
    profile: String,
    latency_ms: Option<u16>,
    seamless_enabled: bool,
    connected: bool,
    clipboard_sync: String,
}

#[tauri::command]
fn get_status() -> OnstellStatus {
    OnstellStatus {
        active_device: "Raspberry Pi".to_string(),
        active_monitor: "Display 2".to_string(),
        profile: "Desk - Laptop Closed".to_string(),
        latency_ms: Some(3),
        seamless_enabled: true,
        connected: false,
        clipboard_sync: "Design only".to_string(),
    }
}

#[tauri::command]
fn show_widget(app: AppHandle) -> Result<(), String> {
    show_main_window(&app)
}

#[tauri::command]
fn hide_widget(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    window.hide().map_err(|error| error.to_string())
}

#[tauri::command]
fn open_widget_settings(app: AppHandle) -> Result<(), String> {
    show_main_window(&app)?;
    app.emit("onstell://open-settings", ())
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn reset_widget_position(app: AppHandle) -> Result<(), String> {
    reset_main_window_position(&app)
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

fn show_main_window(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())
}

fn reset_main_window_position(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    window
        .set_position(PhysicalPosition { x: 48, y: 96 })
        .map_err(|error| error.to_string())?;
    show_main_window(app)
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "Show floating widget", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide floating widget", true, None::<&str>)?;
            let reset =
                MenuItem::with_id(app, "reset", "Reset widget position", true, None::<&str>)?;
            let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Onstell", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &hide, &reset, &settings, &quit])?;

            TrayIconBuilder::with_id("onstell-tray")
                .tooltip("Onstell")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        let _ = show_main_window(app);
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "reset" => {
                        let _ = reset_main_window_position(app);
                    }
                    "settings" => {
                        let _ = show_main_window(app);
                        let _ = app.emit("onstell://open-settings", ());
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let _ = show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_status,
            show_widget,
            hide_widget,
            open_widget_settings,
            reset_widget_position,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running Onstell");
}
