use serde::Serialize;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
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
    }
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "Show floating widget", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide floating widget", true, None::<&str>)?;
            let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Onstell", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &hide, &settings, &quit])?;

            TrayIconBuilder::with_id("onstell-tray")
                .tooltip("Onstell")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" | "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
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
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_status])
        .run(tauri::generate_context!())
        .expect("error while running Onstell");
}

