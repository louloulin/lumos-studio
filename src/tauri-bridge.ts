import { tauriBridge } from './shared/tauri-bridge';

// 为WebviewWindow添加动态导入和错误处理
let WebviewWindow: any = null;

// 异步导入Tauri WebviewWindow
async function loadWebviewWindow() {
  try {
    const module = await import('@tauri-apps/api/webviewWindow');
    WebviewWindow = module.WebviewWindow;
    return true;
  } catch (e) {
    console.warn('Failed to import WebviewWindow:', e);
    return false;
  }
}

// Function to initialize Tauri window event listeners
export async function initializeTauriEvents() {
  try {
    // 确保WebviewWindow已加载
    const isWebviewLoaded = await loadWebviewWindow();
    if (!isWebviewLoaded || !WebviewWindow) {
      console.warn('WebviewWindow module not available, using fallback event handling');
      setupFallbackEventHandlers();
      return;
    }

    // Use a try-catch for getByLabel which may fail if the window doesn't exist yet
    let mainWindow = null;
    try {
      mainWindow = WebviewWindow.getByLabel?.('main');
    } catch (e) {
      console.warn('Could not find main window, using fallback event handling');
    }
    
    // Set up events that were previously handled by Electron IPC
    const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      window.dispatchEvent(new CustomEvent('system-theme-updated'));
    };
    
    darkMediaQuery.addEventListener('change', handleThemeChange);
    
    // Use document visibility instead of window events if window is not available
    if (mainWindow) {
      try {
        // 检查listen方法是否存在
        if (typeof mainWindow.listen === 'function') {
          // In Tauri 2.0, we use listen instead of once
          const unlisten = mainWindow.listen('show', () => {
            window.dispatchEvent(new CustomEvent('window-show'));
          });
        } else {
          // Fallback if listen method doesn't exist
          console.warn('Window listen method not available, using fallback');
          setupFallbackEventHandlers();
        }
      } catch (e) {
        console.warn('Could not add window show listener, using fallback', e);
        setupFallbackEventHandlers();
      }
    } else {
      // If no main window was found, use fallback
      setupFallbackEventHandlers();
    }
  } catch (error) {
    console.error('Failed to initialize Tauri events:', error);
    setupFallbackEventHandlers();
  }
}

// 设置基于DOM事件的fallback处理程序
function setupFallbackEventHandlers() {
  // Always set up the document visibility fallback
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      window.dispatchEvent(new CustomEvent('window-show'));
    }
  });

  // Manually dispatch initial window-show event
  if (!document.hidden) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('window-show'));
    }, 100);
  }
}

export { tauriBridge }; 