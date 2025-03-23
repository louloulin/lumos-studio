import { tauriBridge } from './shared/tauri-bridge';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

// Function to initialize Tauri window event listeners
export function initializeTauriEvents() {
  try {
    // Use a try-catch for getByLabel which may fail if the window doesn't exist yet
    let mainWindow = null;
    try {
      mainWindow = WebviewWindow.getByLabel('main');
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
        // In Tauri 2.0, we use listen instead of once
        const unlisten = mainWindow.listen('show', () => {
          window.dispatchEvent(new CustomEvent('window-show'));
        });
      } catch (e) {
        console.warn('Could not add window show listener, using fallback', e);
      }
    }
    
    // Always set up the document visibility fallback
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        window.dispatchEvent(new CustomEvent('window-show'));
      }
    });
  } catch (error) {
    console.error('Failed to initialize Tauri events:', error);
  }
}

export { tauriBridge }; 