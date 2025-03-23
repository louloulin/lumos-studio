// This file defines the Tauri API interface that replaces the ElectronIPC interface

export interface TauriAPI {
  // Store operations
  getStoreValue: (key: string) => Promise<any>;
  setStoreValue: (key: string, data: any) => Promise<boolean>;
  delStoreValue: (key: string) => Promise<boolean>;
  getAllStoreValues: () => Promise<string>;
  setAllStoreValues: (dataJson: string) => Promise<boolean>;
  
  // App info
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getHostname: () => Promise<string>;
  getLocale: () => Promise<string>;
  
  // System operations
  openLink: (link: string) => Promise<void>;
  shouldUseDarkColors: () => Promise<boolean>;
  
  // Proxy operations
  ensureProxy: (json: string) => Promise<boolean>;
  
  // App operations
  relaunch: () => Promise<boolean>;
}

declare global {
  interface Window {
    tauriAPI: TauriAPI;
  }
}

export {}; 