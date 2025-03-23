// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Command;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn hostname() -> String {
    let output = if cfg!(target_os = "windows") {
        Command::new("hostname")
            .output()
            .expect("failed to execute process")
    } else {
        Command::new("sh")
            .arg("-c")
            .arg("hostname")
            .output()
            .expect("failed to execute process")
    };

    String::from_utf8_lossy(&output.stdout).trim().to_string()
}

#[tauri::command]
fn ensure_proxy(config: &str) -> Result<(), String> {
    // Placeholder for proxy implementation
    println!("Setting proxy: {}", config);
    Ok(())
}

#[tauri::command]
fn relaunch() -> Result<(), String> {
    // This will restart the app
    std::process::exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let path = app.path().data_dir();
            println!("Data directory: {:?}", path);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            hostname,
            ensure_proxy,
            relaunch
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
