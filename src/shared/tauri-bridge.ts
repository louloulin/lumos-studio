// This file acts as a bridge between Electron IPC and Tauri APIs
import { invoke } from "@tauri-apps/api/core";
import { platform, type, arch } from "@tauri-apps/plugin-os";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Store } from "@tauri-apps/plugin-store";
import { openPath } from "@tauri-apps/plugin-opener";
import { TauriAPI } from "./tauri-types";

// Declare the __TAURI__ global property
declare global {
  interface Window {
    __TAURI__?: object;
  }
}

// Create a store instance - this will replace electron-store
// We'll lazy initialize the store to make sure it's only created when needed
let storePromise: Promise<Store | null> | null = null;

// Check if a plugin is available
function isPluginAvailable(pluginName: string): boolean {
  // Check if window.__TAURI_PLUGIN_STORE_INTERNALS__ exists for 'store'
  // Check if window.__TAURI_OS_PLUGIN_INTERNALS__ exists for 'os'
  // Check if window.__TAURI_PLUGIN_OPENER_INTERNALS__ exists for 'opener'
  const internalKey = `__TAURI_${pluginName.toUpperCase()}_PLUGIN_INTERNALS__`;
  return !!(window as any)[internalKey];
}

// Check if Tauri is available
function isTauriAvailable(): boolean {
  return !!window.__TAURI__;
}

async function getStore(): Promise<Store | null> {
  // First check if the store plugin is available
  if (!isPluginAvailable('store')) {
    console.warn('Tauri store plugin not available, using localStorage fallback');
    return null;
  }
  
  if (!storePromise) {
    storePromise = new Promise(async (resolve, reject) => {
      try {
        // In Tauri 2.0, Store doesn't have a load method, it's automatically loaded
        const store = new Store("settings.dat");
        resolve(store);
      } catch (e) {
        console.error('Failed to create Store:', e);
        resolve(null); // Resolve with null instead of rejecting to prevent Promise chain failures
      }
    });
  }
  
  try {
    return await storePromise;
  } catch (e) {
    console.error('Failed to get store:', e);
    return null;
  }
}

// Improved fallback localStorage implementation with better error handling
const localStorageFallback = {
  get: (key: string) => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      
      // Try to parse as JSON, but return the raw value if parsing fails
      try {
        return JSON.parse(value);
      } catch (e) {
        console.warn(`Failed to parse localStorage value for ${key} as JSON, returning raw value`);
        return value;
      }
    } catch (e) {
      console.error(`Error accessing localStorage for key ${key}:`, e);
      return null;
    }
  },
  set: (key: string, value: any) => {
    try {
      // If value is already a string and not a JSON object, store it directly
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, String(value));
      }
      return true;
    } catch (e) {
      console.error(`Error setting localStorage for key ${key}:`, e);
      return false;
    }
  },
  delete: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error removing localStorage for key ${key}:`, e);
      return false;
    }
  },
  entries: () => {
    const entries: [string, any][] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              // Try to parse JSON, but use raw value if parsing fails
              entries.push([key, JSON.parse(value)]);
            } catch (e) {
              entries.push([key, value]);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error reading localStorage entries:", e);
    }
    return entries;
  },
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error("Error clearing localStorage:", e);
      return false;
    }
  }
};

// This is a bridge to map electron IPC calls to Tauri equivalents
export const tauriBridge: TauriAPI = {
  // Store operations
  async getStoreValue(key: string) {
    const store = await getStore();
    if (!store) {
      console.warn(`Using localStorage fallback for getStoreValue(${key})`);
      return localStorageFallback.get(key);
    }
    try {
      return await store.get(key);
    } catch (e) {
      console.error(`Failed to get store value for key ${key}:`, e);
      return localStorageFallback.get(key);
    }
  },
  
  async setStoreValue(key: string, data: any) {
    const store = await getStore();
    if (!store) {
      console.warn(`Using localStorage fallback for setStoreValue(${key})`);
      return localStorageFallback.set(key, data);
    }
    try {
      await store.set(key, data);
      await store.save();
      return true;
    } catch (e) {
      console.error(`Failed to set store value for key ${key}:`, e);
      return localStorageFallback.set(key, data);
    }
  },
  
  async delStoreValue(key: string) {
    const store = await getStore();
    if (!store) {
      console.warn(`Using localStorage fallback for delStoreValue(${key})`);
      return localStorageFallback.delete(key);
    }
    try {
      await store.delete(key);
      await store.save();
      return true;
    } catch (e) {
      console.error(`Failed to delete store value for key ${key}:`, e);
      return localStorageFallback.delete(key);
    }
  },
  
  async getAllStoreValues() {
    const store = await getStore();
    if (!store) {
      console.warn('Using localStorage fallback for getAllStoreValues()');
      return JSON.stringify(Object.fromEntries(localStorageFallback.entries()));
    }
    try {
      const values = await store.entries();
      return JSON.stringify(Object.fromEntries(values || []));
    } catch (e) {
      console.error("Failed to get store entries:", e);
      return JSON.stringify(Object.fromEntries(localStorageFallback.entries()));
    }
  },
  
  async setAllStoreValues(dataJson: string) {
    const store = await getStore();
    if (!store) {
      console.warn('Using localStorage fallback for setAllStoreValues()');
      try {
        let data;
        // Handle the case when dataJson might already be an object
        if (typeof dataJson === 'object') {
          data = dataJson;
        } else {
          data = JSON.parse(dataJson);
        }
        localStorage.clear();
        for (const [key, value] of Object.entries(data)) {
          localStorageFallback.set(key, value);
        }
        return true;
      } catch (e) {
        console.error("Failed to set all localStorage values:", e);
        return false;
      }
    }
    
    try {
      let data;
      // Handle the case when dataJson might already be an object
      if (typeof dataJson === 'object') {
        data = dataJson;
      } else {
        data = JSON.parse(dataJson);
      }
      await store.clear();
      for (const [key, value] of Object.entries(data)) {
        await store.set(key, value);
      }
      await store.save();
      return true;
    } catch (e) {
      console.error("Failed to set all store values:", e);
      return false;
    }
  },
  
  // App info
  async getVersion() {
    try {
      if (!isTauriAvailable()) {
        console.warn('Tauri API not available, using fallback version');
        return "0.0.1-fallback";
      }
      // 更新为Tauri v2版本API
      // 方法1：直接从配置中获取版本
      const tauriConf = (window as any).__TAURI__?.app;
      if (tauriConf?.version) {
        return tauriConf.version;
      }
      // 方法2: 如果app.version不可用，尝试使用备用方法
      return "0.1.0"; // 从tauri.conf.json中获取的硬编码版本号
    } catch (e) {
      console.error("Failed to get app version:", e);
      return "0.0.1-fallback";
    }
  },
  
  async getPlatform() {
    try {
      if (!isPluginAvailable('os')) {
        console.warn('Tauri OS plugin not available, using navigator fallback');
        return navigator.platform.toLowerCase();
      }
      return await platform();
    } catch (e) {
      console.error("Failed to get platform:", e);
      return navigator.platform.toLowerCase();
    }
  },
  
  async getHostname() {
    try {
      if (!isTauriAvailable()) {
        console.warn('Tauri API not available, using fallback hostname');
        return "localhost";
      }
      return await invoke<string>("plugin:core|hostname");
    } catch (e) {
      console.error("Failed to get hostname:", e);
      return "localhost";
    }
  },
  
  async getLocale() {
    return navigator.language;
  },
  
  async openLink(link: string) {
    try {
      if (!isPluginAvailable('opener')) {
        console.warn('Tauri opener plugin not available, using window.open fallback');
        window.open(link, '_blank');
        return;
      }
      return openPath(link);
    } catch (e) {
      console.error(`Failed to open link ${link}:`, e);
      // Fallback to browser open
      window.open(link, '_blank');
    }
  },
  
  async shouldUseDarkColors() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  
  // Placeholder for proxy functions - these need to be implemented in Rust
  async ensureProxy(json: string) {
    console.warn("Proxy functionality needs to be implemented in Rust");
    try {
      if (!isTauriAvailable()) {
        console.warn('Tauri API not available, proxy configuration skipped');
        return false;
      }
      return await invoke<boolean>("ensure_proxy", { config: json });
    } catch (e) {
      console.error("Failed to ensure proxy:", e);
      return false;
    }
  },
  
  async relaunch() {
    try {
      if (!isTauriAvailable()) {
        console.warn('Tauri API not available, relaunch skipped');
        return false;
      }
      await invoke("relaunch");
      return true;
    } catch (e) {
      console.error("Failed to relaunch:", e);
      return false;
    }
  }
}; 