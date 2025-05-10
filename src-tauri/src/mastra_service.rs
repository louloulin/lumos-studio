use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use std::{env, fs, thread};
use tauri::Manager;
use std::net::TcpListener;

/// 表示服务的状态
#[derive(Clone, Copy, Debug, PartialEq)]
enum ServiceStatus {
    Stopped,
    Running,
    Failed,
}

/// MastraService结构体，管理Mastra后台服务
#[derive(Clone)]
pub struct MastraService {
    process: Arc<Mutex<Option<Child>>>,
    port: Arc<Mutex<u16>>,
    is_production: bool,
    status: Arc<Mutex<ServiceStatus>>,
    last_start: Arc<Mutex<Option<Instant>>>,
    restart_attempts: Arc<Mutex<u32>>,
    max_restart_attempts: u32,
    restart_cooldown: Duration,
    // 标志位，表示是否应该在Drop时停止服务
    should_stop_on_drop: Arc<Mutex<bool>>,
}

impl MastraService {
    /// 创建一个新的MastraService实例
    pub fn new(port: u16, is_production: bool) -> Self {
        MastraService {
            process: Arc::new(Mutex::new(None)),
            port: Arc::new(Mutex::new(port)),
            is_production,
            status: Arc::new(Mutex::new(ServiceStatus::Stopped)),
            last_start: Arc::new(Mutex::new(None)),
            restart_attempts: Arc::new(Mutex::new(0)),
            max_restart_attempts: 5,
            restart_cooldown: Duration::from_secs(5),
            should_stop_on_drop: Arc::new(Mutex::new(true)), // 默认为true
        }
    }

    /// 检查端口是否被占用
    fn is_port_in_use(&self, port: u16) -> bool {
        // 检查IPv4
        let ipv4_in_use = match TcpListener::bind(format!("127.0.0.1:{}", port)) {
            Ok(_) => false, // 端口可用
            Err(_) => true,  // 端口被占用
        };
        
        // 检查IPv6
        let ipv6_in_use = match TcpListener::bind(format!("::1:{}", port)) {
            Ok(_) => false, // 端口可用
            Err(_) => true,  // 端口被占用
        };
        
        // 检查通配符地址 (捕获所有接口上的绑定)
        let any_in_use = match TcpListener::bind(format!("0.0.0.0:{}", port)) {
            Ok(_) => false,
            Err(_) => true,
        };
        
        // 如果任何一个检查显示端口被占用，则返回true
        ipv4_in_use || ipv6_in_use || any_in_use
    }

    /// 尝试终止占用端口的进程
    fn kill_process_on_port(&self, port: u16) -> Result<bool, String> {
        println!("Attempting to kill process on port {}...", port);
        
        let mut success = false;
        
        #[cfg(target_os = "windows")]
        {
            // Windows平台使用netstat和taskkill
            let netstat_output = Command::new("cmd")
                .args(&["/c", &format!("netstat -ano | findstr :{}", port)])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|e| format!("Failed to execute netstat command: {}", e))?;
            
            let output_str = String::from_utf8_lossy(&netstat_output.stdout);
            
            // 解析输出找到PID
            for line in output_str.lines() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 5 {
                    if let Ok(pid) = parts[4].parse::<u32>() {
                        println!("Found process with PID {} using port {}", pid, port);
                        
                        // 杀死进程
                        let kill_result = Command::new("taskkill")
                            .args(&["/F", "/PID", &pid.to_string()])
                            .output();
                            
                        match kill_result {
                            Ok(_) => {
                                println!("Successfully killed process with PID {}", pid);
                                success = true;
                            },
                            Err(e) => {
                                println!("Failed to kill process with PID {}: {}", pid, e);
                            }
                        }
                    }
                }
            }
        }
        
        #[cfg(target_os = "macos")]
        {
            // macOS平台使用lsof和kill
            // 同时检查IPv4和IPv6
            let lsof_output = Command::new("lsof")
                .args(&["-i", &format!(":{}", port)])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|e| format!("Failed to execute lsof command: {}", e))?;
            
            let output_str = String::from_utf8_lossy(&lsof_output.stdout);
            println!("lsof output: {}", output_str);
            
            // 解析输出找到所有PID
            let mut pids = Vec::new();
            for line in output_str.lines().skip(1) { // 跳过标题行
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    if let Ok(pid) = parts[1].parse::<u32>() {
                        pids.push(pid);
                    }
                }
            }
            
            // 去重
            pids.sort();
            pids.dedup();
            
            // 杀死所有找到的进程
            for pid in pids {
                println!("Found process with PID {} using port {}", pid, port);
                
                // 杀死进程
                let kill_result = Command::new("kill")
                    .args(&["-9", &pid.to_string()])
                    .output();
                    
                match kill_result {
                    Ok(_) => {
                        println!("Successfully killed process with PID {}", pid);
                        success = true;
                    },
                    Err(e) => {
                        println!("Failed to kill process with PID {}: {}", pid, e);
                    }
                }
            }
        }
        
        #[cfg(target_os = "linux")]
        {
            // Linux平台使用ss和kill获取更多信息
            let ss_output = Command::new("ss")
                .args(&["-tuln", "sport", &format!("= :{}", port)])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output();
            
            let pid_output = match ss_output {
                Ok(output) => {
                    let ss_str = String::from_utf8_lossy(&output.stdout);
                    println!("Listening processes: {}", ss_str);
                    
                    // 使用fuser获取PID
                    Command::new("fuser")
                        .args(&[&format!("{}/tcp", port), "-k"])
                        .stdout(Stdio::piped())
                        .stderr(Stdio::piped())
                        .output()
                },
                Err(_) => {
                    // 如果ss命令失败，回退到使用lsof
                    println!("ss command failed, falling back to lsof");
                    Command::new("lsof")
                        .args(&["-i", &format!(":{}", port), "-t"])
                        .stdout(Stdio::piped())
                        .stderr(Stdio::piped())
                        .output()
                }
            };
            
            if let Ok(output) = pid_output {
                let output_str = String::from_utf8_lossy(&output.stdout);
                
                // 解析输出找到PID
                for line in output_str.lines() {
                    if let Ok(pid) = line.trim().parse::<u32>() {
                        println!("Found process with PID {} using port {}", pid, port);
                        
                        // 杀死进程
                        let kill_result = Command::new("kill")
                            .args(&["-9", &pid.to_string()])
                            .output();
                            
                        match kill_result {
                            Ok(_) => {
                                println!("Successfully killed process with PID {}", pid);
                                success = true;
                            },
                            Err(e) => {
                                println!("Failed to kill process with PID {}: {}", pid, e);
                            }
                        }
                    }
                }
            }
        }
        
        // 如果成功杀死了至少一个进程，则等待一段时间让端口释放
        if success {
            println!("Waiting for port {} to be released...", port);
            thread::sleep(Duration::from_millis(500));
        }
        
        // 没找到进程或者没有成功杀死进程
        if !success {
            println!("No process found or could not kill processes using port {}", port);
        }
        
        Ok(success)
    }

    /// 启动Mastra服务
    pub fn start(&self, app_handle: &tauri::AppHandle) -> Result<(), String> {
        let mut process = self.process.lock().unwrap();
        let mut status = self.status.lock().unwrap();
        let mut last_start = self.last_start.lock().unwrap();
        let mut restart_attempts = self.restart_attempts.lock().unwrap();
        let mut port = self.port.lock().unwrap();
        
        // 如果服务已在运行，直接返回
        if *status == ServiceStatus::Running && process.is_some() {
            return Ok(());
        }
        
        // 检查重启冷却时间
        if let Some(time) = *last_start {
            if time.elapsed() < self.restart_cooldown {
                return Err(format!("Service restart attempted too soon. Please wait {} seconds before retrying.", 
                    (self.restart_cooldown - time.elapsed()).as_secs()));
            }
        }
        
        // 更新上次启动时间
        *last_start = Some(Instant::now());
        
        // 检查端口是否被占用
        if self.is_port_in_use(*port) {
            println!("Port {} is already in use. Attempting to kill the process...", *port);
            
            // 尝试终止占用端口的进程
            match self.kill_process_on_port(*port) {
                Ok(true) => {
                    println!("Successfully killed process on port {}. Waiting for port to be available...", *port);
                    // 等待端口释放 - 增加等待时间确保端口完全释放
                    thread::sleep(Duration::from_secs(2));
                    
                    // 最多尝试3次
                    for attempt in 1..=3 {
                        // 再次检查端口
                        if self.is_port_in_use(*port) {
                            if attempt < 3 {
                                println!("Port {} is still in use after kill attempt {}. Waiting more time...", *port, attempt);
                                thread::sleep(Duration::from_secs(2));
                            } else {
                                println!("Port {} is still in use after 3 attempts. Trying another port.", *port);
                                *port += 1;
                                println!("Now using port {}", *port);
                            }
                        } else {
                            println!("Port {} is now available.", *port);
                            break;
                        }
                    }
                },
                Ok(false) => {
                    println!("No process found using port {}. It might be used by a system service.", *port);
                    // 尝试使用另一个端口
                    println!("Trying to use another port...");
                    *port += 1;
                    println!("Now using port {}", *port);
                    
                    // 确保新端口是可用的
                    while self.is_port_in_use(*port) {
                        println!("Port {} is also in use. Trying next port...", *port);
                        *port += 1;
                    }
                },
                Err(e) => {
                    println!("Error killing process on port {}: {}", *port, e);
                    // 尝试使用另一个端口
                    println!("Trying to use another port...");
                    *port += 1;
                    println!("Now using port {}", *port);
                    
                    // 确保新端口是可用的
                    while self.is_port_in_use(*port) {
                        println!("Port {} is also in use. Trying next port...", *port);
                        *port += 1;
                    }
                }
            }
        }
        
        println!("Using port: {}", *port);
        
        // 获取应用数据目录
        let app_dir = app_handle.path().app_data_dir().unwrap();
        let mastra_dir = app_dir.join("mastrax");
        
        println!("App data directory: {:?}", app_dir);
        println!("Mastra directory: {:?}", mastra_dir);
        
        if !mastra_dir.exists() {
            println!("Creating mastra directory: {:?}", mastra_dir);
            fs::create_dir_all(&mastra_dir).map_err(|e| format!("Failed to create mastra directory: {}", e))?;
        }

        let exec_path;
        let cwd;
        
        if self.is_production {
            // 在生产环境中使用资源目录下的mastrax_dist
            println!("Running in production mode");
            let binary_path = self.copy_mastra_files(app_handle, &mastra_dir)?;
            exec_path = binary_path;
            cwd = mastra_dir;
        } else {
            // 在开发环境中使用项目根目录下的mastrax目录
            println!("Running in development mode");
            let workspace_dir = env::current_dir().map_err(|e| format!("Failed to get current directory: {}", e))?;
            println!("Current workspace directory: {:?}", workspace_dir);
            
            let source_dir = if workspace_dir.ends_with("src-tauri") {
                let parent_dir = workspace_dir.parent().ok_or_else(|| "Failed to get parent directory".to_string())?;
                println!("Parent directory: {:?}", parent_dir);
                let mastrax_dir = parent_dir.join("mastrax");
                println!("mastrax directory: {:?}", mastrax_dir);
                mastrax_dir
            } else {
                let mastrax_dir = workspace_dir.join("mastrax");
                println!("mastrax directory: {:?}", mastrax_dir);
                mastrax_dir
            };
            
            if !source_dir.exists() {
                return Err(format!("Mastra source directory not found at {:?}", source_dir));
            }
            
            // 确保使用完整路径或在PATH中的命令
            #[cfg(target_os = "windows")]
            {
                exec_path = "bun.cmd".into();
            }
            #[cfg(not(target_os = "windows"))]
            {
                // 尝试找到完整的bun路径
                let bun_path = which::which("bun").map_err(|e| format!("Failed to find bun: {}", e))?;
                println!("Found bun at: {:?}", bun_path);
                exec_path = bun_path;
            }
            
            cwd = source_dir;
        }

        let port_str = port.to_string();
        let mut cmd = Command::new(&exec_path);
        
        if self.is_production {
            println!("Running production command: {:?} index.mjs", exec_path);
            cmd.arg("index.mjs");
        } else {
            println!("Running development command: {:?} run dev", exec_path);
            cmd.arg("run").arg("dev");
        }
        
        cmd.env("PORT", &port_str)
            .current_dir(&cwd);
        
        println!("Starting Mastra service with command: {:?} in directory: {:?}", &cmd, &cwd);
        println!("ENV PORT={}", port_str);
        
        let child = match cmd.spawn() {
            Ok(child) => {
                println!("Successfully spawned Mastra service process with PID: {}", child.id());
                child
            },
            Err(e) => {
                println!("Failed to start Mastra service: {}", e);
                *status = ServiceStatus::Failed;
                *restart_attempts += 1;
                return Err(format!("Failed to start Mastra service: {}", e));
            }
        };
        
        *process = Some(child);
        *status = ServiceStatus::Running;
        *restart_attempts = 0; // 重置重启计数
        
        // 记录服务状态
        let service_type = if self.is_production { "production" } else { "development" };
        println!("Started Mastra service ({}) on port {} - service will run in background", service_type, *port);
        
        // 设置自动重启监控
        self.setup_auto_restart(app_handle.clone());
        
        Ok(())
    }
    
    /// 设置自动重启监控
    fn setup_auto_restart(&self, app_handle: tauri::AppHandle) {
        let service_clone = self.clone();
        
        // 在后台线程中监控服务
        thread::spawn(move || {
            // 小睡片刻，让服务有时间启动
            thread::sleep(Duration::from_secs(2));
            
            loop {
                // 检查服务状态
                {
                    let status = service_clone.status.lock().unwrap();
                    if *status != ServiceStatus::Running {
                        // 如果服务不在运行，不需要监控
                        break;
                    }
                }
                
                // 检查进程是否还在运行
                let is_running = {
                    let mut process = service_clone.process.lock().unwrap();
                    match process.as_mut() {
                        Some(child) => match child.try_wait() {
                            Ok(Some(_)) => {
                                // 进程已结束
                                false
                            },
                            Ok(None) => {
                                // 进程正在运行
                                true
                            },
                            Err(_) => {
                                // 检查错误，假定进程不在运行
                                false
                            }
                        },
                        None => false
                    }
                };
                
                if !is_running {
                    let should_restart = {
                        let restart_attempts = service_clone.restart_attempts.lock().unwrap();
                        *restart_attempts < service_clone.max_restart_attempts
                    };
                    
                    if should_restart {
                        println!("Mastra service stopped unexpectedly. Attempting automatic restart...");
                        
                        // 清除旧进程
                        {
                            let mut process = service_clone.process.lock().unwrap();
                            *process = None;
                        }
                        
                        // 更新状态为停止
                        {
                            let mut status = service_clone.status.lock().unwrap();
                            *status = ServiceStatus::Stopped;
                        }
                        
                        // 尝试重启
                        match service_clone.start(&app_handle) {
                            Ok(_) => println!("Mastra service restarted successfully"),
                            Err(e) => {
                                println!("Failed to restart Mastra service: {}", e);
                                // 如果重启失败，再次更新状态为失败
                                let mut status = service_clone.status.lock().unwrap();
                                *status = ServiceStatus::Failed;
                                break;
                            }
                        }
                    } else {
                        println!("Maximum restart attempts ({}) reached. Giving up on automatic restarts.", 
                            service_clone.max_restart_attempts);
                        
                        let mut status = service_clone.status.lock().unwrap();
                        *status = ServiceStatus::Failed;
                        break;
                    }
                }
                
                // 每5秒检查一次
                thread::sleep(Duration::from_secs(5));
            }
        });
    }
    
    fn copy_mastra_files(&self, app_handle: &tauri::AppHandle, target_dir: &Path) -> Result<PathBuf, String> {
        // 资源路径处理
        let resource_path = match app_handle.path().resource_dir() {
            Ok(dir) => dir.join("mastrax_dist"),
            Err(e) => return Err(format!("Failed to get resource directory: {}", e)),
        };
            
        if !resource_path.exists() {
            return Err(format!("Mastra resources not found at {:?}", resource_path));
        }
        
        self.copy_dir_all(&resource_path, target_dir)
            .map_err(|e| format!("Failed to copy Mastra files: {}", e))?;
            
        let bin_path = target_dir.join("index.mjs");
        if !bin_path.exists() {
            return Err("Mastra executable not found after copy".to_string());
        }
        
        Ok(bin_path)
    }
    
    fn copy_dir_all(&self, src: &Path, dst: &Path) -> std::io::Result<()> {
        if !dst.exists() {
            fs::create_dir_all(dst)?;
        }
        
        for entry in fs::read_dir(src)? {
            let entry = entry?;
            let ty = entry.file_type()?;
            let src_path = entry.path();
            let dst_path = dst.join(entry.file_name());
            
            if ty.is_dir() {
                self.copy_dir_all(&src_path, &dst_path)?;
            } else {
                fs::copy(&src_path, &dst_path)?;
            }
        }
        
        Ok(())
    }

    /// 设置是否在Drop时停止服务
    pub fn set_stop_on_drop(&self, should_stop: bool) {
        let mut should_stop_on_drop = self.should_stop_on_drop.lock().unwrap();
        *should_stop_on_drop = should_stop;
    }

    /// 停止Mastra服务
    pub fn stop(&self) -> Result<(), String> {
        let mut process = self.process.lock().unwrap();
        let mut status = self.status.lock().unwrap();
        
        // 只有在服务实际运行时才尝试停止
        if let Some(mut child) = process.take() {
            match child.kill() {
                Ok(_) => {
                    println!("Stopped Mastra service - Application is exiting");
                    *status = ServiceStatus::Stopped;
                    Ok(())
                }
                Err(e) => {
                    Err(format!("Failed to kill Mastra service: {}", e))
                }
            }
        } else {
            // 如果没有进程，也更新状态
            *status = ServiceStatus::Stopped;
            Ok(())
        }
    }
    
    /// 获取服务URL
    pub fn get_url(&self) -> String {
        let port = self.port.lock().unwrap();
        format!("http://localhost:{}", *port)
    }
    
    /// 检查服务是否在运行
    pub fn is_running(&self) -> bool {
        let status = self.status.lock().unwrap();
        *status == ServiceStatus::Running
    }
    
    /// 获取服务状态
    pub fn get_status(&self) -> ServiceStatus {
        let status = self.status.lock().unwrap();
        *status
    }
    
    /// 重置重启计数
    pub fn reset_restart_attempts(&self) {
        let mut restart_attempts = self.restart_attempts.lock().unwrap();
        *restart_attempts = 0;
    }
}

impl Drop for MastraService {
    fn drop(&mut self) {
        // 检查是否应该在Drop时停止服务
        let should_stop = {
            let should_stop_on_drop = self.should_stop_on_drop.lock().unwrap();
            *should_stop_on_drop
        };
        
        if should_stop {
            println!("MastraService被销毁，停止服务...");
            let _ = self.stop();
        } else {
            println!("MastraService被销毁，但服务将继续运行...");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::TcpListener;
    
    #[test]
    fn test_is_port_in_use() {
        let service = MastraService::new(8000, false);
        
        // 端口应该是空闲的
        assert_eq!(service.is_port_in_use(8000), false);
        
        // 占用端口
        let listener = TcpListener::bind("127.0.0.1:8001").unwrap();
        
        // 端口应该被占用
        assert_eq!(service.is_port_in_use(8001), true);
        
        // 释放端口
        drop(listener);
        
        // 端口应该再次空闲
        assert_eq!(service.is_port_in_use(8001), false);
    }
    
    #[test]
    fn test_port_update() {
        let service = MastraService::new(8000, false);
        
        // 初始端口应该是8000
        {
            let port = service.port.lock().unwrap();
            assert_eq!(*port, 8000);
        }
        
        // 修改端口
        {
            let mut port = service.port.lock().unwrap();
            *port = 8001;
        }
        
        // 更新后的端口应该是8001
        {
            let port = service.port.lock().unwrap();
            assert_eq!(*port, 8001);
        }
        
        // 获取URL应该使用新端口
        assert_eq!(service.get_url(), "http://localhost:8001");
    }
} 