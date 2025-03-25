// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Command;
use tauri::Manager;

mod mastra_service;
use mastra_service::MastraService;

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

#[tauri::command]
fn get_mastra_url(state: tauri::State<'_, MastraState>) -> String {
    state.mastra_service.get_url()
}

#[tauri::command]
fn is_mastra_running(state: tauri::State<'_, MastraState>) -> bool {
    state.mastra_service.is_running()
}

// 全局服务状态
struct MastraState {
    mastra_service: MastraService,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 创建并初始化 Mastra 服务
    let mastra_service = MastraService::new(4111, !cfg!(debug_assertions));
    let mastra_state = MastraState { mastra_service };
    
    tauri::Builder::default()
        .setup(|app| {
            let path = app.path().data_dir();
            println!("Data directory: {:?}", path);
            
            // 获取一个克隆的 AppHandle 以避免借用问题
            let app_handle = app.handle().clone();
            
            // 在后台任务中启动服务，避免阻塞设置
            tauri::async_runtime::spawn(async move {
                // 获取服务状态
                if let Some(state) = app_handle.try_state::<MastraState>() {
                    // 启动服务
                    println!("Starting Mastra service from async task");
                    if let Err(e) = state.mastra_service.start(&app_handle) {
                        println!("Failed to start Mastra service: {}", e);
                    }
                }
            });
            
            // Note: 服务的停止逻辑由 MastraService 的 Drop 实现自动处理
            // 在应用退出时，MastraState 和其中的服务会自动销毁，触发停止逻辑
            
            Ok(())
        })
        .manage(mastra_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            hostname,
            ensure_proxy,
            relaunch,
            get_mastra_url,
            is_mastra_running
        ])
        .on_window_event(|window, event| {
            // 仅处理窗口关闭请求 - 不再处理窗口被销毁事件
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // 如果是主窗口，隐藏而不是关闭
                if window.label() == "main" {
                    println!("Main window closing, but Mastra service will continue running in background");
                    
                    // 获取应用句柄和服务状态
                    let app_handle = window.app_handle();
                    if let Some(state) = app_handle.try_state::<MastraState>() {
                        // 设置服务在窗口关闭时不停止
                        state.mastra_service.set_stop_on_drop(false);
                    }
                    
                    // 阻止窗口关闭，只是隐藏它
                    api.prevent_close();
                    window.hide().unwrap();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 