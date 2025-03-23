import { tauriBridge } from "../shared/tauri-bridge";
import { DesktopPlatform } from "../packages/platform";

// Cache of the platform instance
let platformPromise: Promise<DesktopPlatform> | null = null;

/**
 * Get the platform instance asynchronously
 * This ensures that the platform is properly initialized
 */
export async function getPlatform(): Promise<DesktopPlatform> {
  // Return cached platform if available
  if (window.__platformInstance) {
    return window.__platformInstance;
  }

  // Return existing promise if already in progress
  if (platformPromise) {
    return platformPromise;
  }

  // Create and cache new promise
  platformPromise = new Promise(async (resolve) => {
    try {
      // Initialize tauriAPI if not already done
      if (!window.tauriAPI) {
        window.tauriAPI = tauriBridge;
      }
      
      // Create a new platform instance
      const platform = new DesktopPlatform(window.tauriAPI);
      
      // Cache the platform instance
      window.__platformInstance = platform;
      resolve(platform);
    } catch (e) {
      console.error("Failed to initialize platform:", e);
      
      // Create a fallback platform with the tauriBridge
      const platform = new DesktopPlatform(tauriBridge);
      
      // Cache the fallback platform
      window.__platformInstance = platform;
      resolve(platform);
    }
  });
  
  return platformPromise;
}

/**
 * Get platform synchronously - returns cached instance or creates a new one
 * This is useful for components that need platform info but can't use async functions
 */
export function getPlatformSync(): DesktopPlatform {
  if (window.__platformInstance) {
    return window.__platformInstance;
  }
  
  // Initialize tauriAPI if not already done
  if (!window.tauriAPI) {
    window.tauriAPI = tauriBridge;
  }
  
  // Create a new platform instance
  const platform = new DesktopPlatform(window.tauriAPI);
  
  // Cache the platform instance
  window.__platformInstance = platform;
  
  return platform;
}

/**
 * Initialize platform early on app startup
 */
export async function initPlatform(): Promise<boolean> {
  try {
    await getPlatform();
    return true;
  } catch (e) {
    console.error("Failed to initialize platform:", e);
    return false;
  }
} 