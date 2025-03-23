import { TauriAPI } from '@/shared/tauri-types'
import { Config, Settings, ModelProvider, Theme } from '@/shared/types'
import { getOS } from './navigator'
import { parseLocale } from '@/i18n/parser'
import Exporter from './exporter'

export class DesktopPlatform {
    public tauriAPI: TauriAPI
    constructor(tauriAPI: TauriAPI) {
        this.tauriAPI = tauriAPI
    }

    public exporter = new Exporter()

    public async getVersion() {
        try {
            return await this.tauriAPI.getVersion()
        } catch (e) {
            console.error('Failed to get version:', e)
            return 'unknown'
        }
    }
    public async getPlatform() {
        try {
            return await this.tauriAPI.getPlatform()
        } catch (e) {
            console.error('Failed to get platform:', e)
            return 'unknown'
        }
    }
    public async shouldUseDarkColors(): Promise<boolean> {
        try {
            return await this.tauriAPI.shouldUseDarkColors()
        } catch (e) {
            console.error('Failed to get dark colors preference:', e)
            // Fallback to media query
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        }
    }
    public onSystemThemeChange(callback: () => void): () => void {
        // For Tauri, we'll use window.matchMedia to detect theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const listener = () => callback()
        mediaQuery.addEventListener('change', listener)
        return () => mediaQuery.removeEventListener('change', listener)
    }
    public onWindowShow(callback: () => void): () => void {
        // For Tauri, we'll use document.visibilitychange
        const listener = () => {
            if (!document.hidden) callback()
        }
        document.addEventListener('visibilitychange', listener)
        return () => document.removeEventListener('visibilitychange', listener)
    }
    public async openLink(url: string): Promise<void> {
        try {
            return await this.tauriAPI.openLink(url)
        } catch (e) {
            console.error('Failed to open link:', e)
            // Fallback to window.open
            window.open(url, '_blank')
        }
    }
    public async getInstanceName(): Promise<string> {
        try {
            const hostname = await this.tauriAPI.getHostname()
            return `${hostname} / ${getOS()}`
        } catch (e) {
            console.error('Failed to get hostname:', e)
            return `Unknown / ${getOS()}`
        }
    }
    public async getLocale() {
        try {
            const locale = await this.tauriAPI.getLocale()
            return parseLocale(locale)
        } catch (e) {
            console.error('Failed to get locale:', e)
            return parseLocale(navigator.language)
        }
    }
    public async ensureShortcutConfig(config: { disableQuickToggleShortcut: boolean }): Promise<void> {
        // Not implemented in Tauri yet
        console.warn("Shortcut configuration not implemented in Tauri yet")
        return Promise.resolve()
    }
    public async ensureProxyConfig(config: { proxy?: string }): Promise<void> {
        try {
            await this.tauriAPI.ensureProxy(JSON.stringify(config));
            return;
        } catch (e) {
            console.error('Failed to ensure proxy:', e)
            return Promise.resolve()
        }
    }
    public async relaunch(): Promise<void> {
        try {
            await this.tauriAPI.relaunch();
            return;
        } catch (e) {
            console.error('Failed to relaunch:', e)
            // No fallback for relaunch
            return Promise.resolve()
        }
    }

    public async getConfig(): Promise<Config> {
        try {
            // In Tauri, we'll get this from store
            const configValue = await this.tauriAPI.getStoreValue('config')
            
            // Handle the case when the value is not a string but already an object
            if (configValue && typeof configValue === 'object') {
                return configValue as Config;
            }
            
            // Handle the string case (parse it)
            if (configValue && typeof configValue === 'string') {
                try {
                    return JSON.parse(configValue);
                } catch (parseError) {
                    console.error('Failed to parse config JSON:', parseError);
                    // Return default on parse error
                    return {
                        uuid: crypto.randomUUID()
                    };
                }
            }
            
            // Return default if value is null/undefined
            return {
                uuid: crypto.randomUUID() // Generate a default UUID if none exists
            }
        } catch (e) {
            console.error('Failed to get config:', e)
            return {
                uuid: crypto.randomUUID() // Generate a default UUID on error
            }
        }
    }
    public async getSettings(): Promise<Settings> {
        try {
            // In Tauri, we'll get this from store
            const settingsValue = await this.tauriAPI.getStoreValue('settings')
            
            const defaultSettings: Settings = {
                aiProvider: ModelProvider.OpenAI,
                openaiKey: '',
                apiHost: '',
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                topP: 1,
                openaiMaxContextMessageCount: 10,
                
                theme: Theme.FollowSystem,
                language: 'en',
                fontSize: 14,
                spellCheck: true,
                
                showWordCount: true,
                showTokenCount: true,
                showTokenUsed: true,
                showModelName: true,
                showMessageTimestamp: true,
                
                allowReportingAndTracking: false,
                preserveSessions: true,
                autoSave: true,
                saveInterval: 30000,
                
                enableMarkdownRendering: true,
                autoGenerateTitle: true,
                
                // Claude models
                claudeApiKey: '',
                claudeApiHost: 'https://api.anthropic.com',
                claudeModel: 'claude-3-opus-20240229',
                
                // Ollama
                ollamaHost: 'http://localhost:11434',
                ollamaModel: 'llama2',
                
                // Silicon Flow
                siliconCloudHost: '',
                siliconCloudKey: '',
                siliconCloudModel: 'yi-34b',
                
                // LM Studio
                lmStudioHost: 'http://localhost:1234',
                lmStudioModel: 'default',
                
                // PPIO
                ppioHost: '',
                ppioKey: '',
                ppioModel: '',
                
                // Azure
                azureEndpoint: '',
                azureDeploymentName: '',
                azureDalleDeploymentName: '',
                azureApikey: '',
                
                // ChatGLM
                chatglm6bUrl: '',
            }
            
            // Handle the case when the value is not a string but already an object
            if (settingsValue && typeof settingsValue === 'object') {
                return { ...defaultSettings, ...settingsValue };
            }
            
            // Handle the string case (parse it)
            if (settingsValue && typeof settingsValue === 'string') {
                try {
                    const parsedSettings = JSON.parse(settingsValue);
                    return { ...defaultSettings, ...parsedSettings };
                } catch (parseError) {
                    console.error('Failed to parse settings JSON:', parseError);
                    // Return default on parse error
                    return defaultSettings;
                }
            }
            
            // Return default if value is null/undefined
            return defaultSettings;
        } catch (e) {
            console.error('Failed to get settings:', e)
            return {
                aiProvider: ModelProvider.OpenAI,
                openaiKey: '',
                apiHost: '',
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                topP: 1,
                openaiMaxContextMessageCount: 10,
                
                theme: Theme.FollowSystem,
                language: 'en',
                fontSize: 14,
                spellCheck: true,
                
                showWordCount: true,
                showTokenCount: true,
                showTokenUsed: true,
                showModelName: true,
                showMessageTimestamp: true,
                
                allowReportingAndTracking: false,
                preserveSessions: true,
                autoSave: true,
                saveInterval: 30000,
                
                enableMarkdownRendering: true,
                autoGenerateTitle: true,
                
                // Claude models
                claudeApiKey: '',
                claudeApiHost: 'https://api.anthropic.com',
                claudeModel: 'claude-3-opus-20240229',
                
                // Ollama
                ollamaHost: 'http://localhost:11434',
                ollamaModel: 'llama2',
                
                // Silicon Flow
                siliconCloudHost: '',
                siliconCloudKey: '',
                siliconCloudModel: 'yi-34b',
                
                // LM Studio
                lmStudioHost: 'http://localhost:1234',
                lmStudioModel: 'default',
                
                // PPIO
                ppioHost: '',
                ppioKey: '',
                ppioModel: '',
                
                // Azure
                azureEndpoint: '',
                azureDeploymentName: '',
                azureDalleDeploymentName: '',
                azureApikey: '',
                
                // ChatGLM
                chatglm6bUrl: '',
            }
        }
    }

    public async setStoreValue(key: string, value: any) {
        try {
            return await this.tauriAPI.setStoreValue(key, value)
        } catch (e) {
            console.error(`Failed to set store value for key ${key}:`, e)
            return false
        }
    }
    
    public async getStoreValue(key: string) {
        try {
            return await this.tauriAPI.getStoreValue(key)
        } catch (e) {
            console.error(`Failed to get store value for key ${key}:`, e)
            return null
        }
    }
    
    public delStoreValue(key: string) {
        try {
            return this.tauriAPI.delStoreValue(key)
        } catch (e) {
            console.error(`Failed to delete store value for key ${key}:`, e)
            return Promise.resolve(false)
        }
    }
    
    public async getAllStoreValues(): Promise<{ [key: string]: any }> {
        try {
            const json = await this.tauriAPI.getAllStoreValues()
            return JSON.parse(json)
        } catch (e) {
            console.error('Failed to get all store values:', e)
            return {}
        }
    }
    
    public async setAllStoreValues(data: { [key: string]: any }) {
        try {
            await this.tauriAPI.setAllStoreValues(JSON.stringify(data))
            return true
        } catch (e) {
            console.error('Failed to set all store values:', e)
            return false
        }
    }

    public initTracking(): void {
        this.trackingEvent('user_engagement', {})
    }
    
    public trackingEvent(name: string, params: { [key: string]: string }) {
        // Analytics tracking to be implemented in Tauri
        console.warn('Analytics tracking not implemented in Tauri yet')
    }

    public async shouldShowAboutDialogWhenStartUp(): Promise<boolean> {
        try {
            // Simplified implementation for Tauri
            const currentVersion = await this.getVersion()
            const lastVersion = await this.getStoreValue('lastShownAboutDialogVersion')
            if (lastVersion === currentVersion) {
                return false
            }
            await this.setStoreValue('lastShownAboutDialogVersion', currentVersion)
            return true
        } catch (e) {
            console.error('Failed to check about dialog:', e)
            return false
        }
    }

    public async appLog(level: string, message: string) {
        // Logging to be implemented in Tauri
        if (level === 'error') {
            console.error(message);
        } else if (level === 'warn') {
            console.warn(message);
        } else if (level === 'info') {
            console.info(message);
        } else {
            console.log(message);
        }
        return Promise.resolve()
    }
}

function getPlatform() {
  // Check if we've already created a platform instance
  // @ts-ignore - Added for backward compatibility
  if (window.__platformInstance) {
    // @ts-ignore - Added for backward compatibility
    return window.__platformInstance;
  }
  
  let platform: DesktopPlatform;
  
  // If tauriAPI is not available yet, create a fallback implementation
  if (!window.tauriAPI) {
    const fallbackTauriAPI: TauriAPI = {
      // Store operations
      getStoreValue: async (key: string) => {
        console.warn(`Using fallback for getStoreValue(${key})`);
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      },
      setStoreValue: async (key: string, data: any) => {
        console.warn(`Using fallback for setStoreValue(${key})`);
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      },
      delStoreValue: async (key: string) => {
        console.warn(`Using fallback for delStoreValue(${key})`);
        localStorage.removeItem(key);
        return true;
      },
      getAllStoreValues: async () => {
        console.warn("Using fallback for getAllStoreValues()");
        const values: Record<string, unknown> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value) {
              try {
                values[key] = JSON.parse(value);
              } catch {
                values[key] = value;
              }
            }
          }
        }
        return JSON.stringify(values);
      },
      setAllStoreValues: async (dataJson: string) => {
        console.warn("Using fallback for setAllStoreValues()");
        try {
          const data = JSON.parse(dataJson);
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, JSON.stringify(value));
          }
          return true;
        } catch (e) {
          console.error("Failed to set all store values:", e);
          return false;
        }
      },
      // App info
      getVersion: async () => {
        console.warn("Using fallback for getVersion()");
        return "0.0.1-fallback";
      },
      getPlatform: async () => {
        console.warn("Using fallback for getPlatform()");
        return "web";
      },
      getHostname: async () => {
        console.warn("Using fallback for getHostname()");
        return "localhost";
      },
      getLocale: async () => {
        console.warn("Using fallback for getLocale()");
        return navigator.language;
      },
      openLink: async (link: string) => {
        console.warn(`Using fallback for openLink(${link})`);
        window.open(link, '_blank');
      },
      shouldUseDarkColors: async () => {
        console.warn("Using fallback for shouldUseDarkColors()");
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      },
      ensureProxy: async (json: string) => {
        console.warn("Using fallback for ensureProxy()");
        return false;
      },
      relaunch: async () => {
        console.warn("Using fallback for relaunch()");
        return false;
      }
    };
    
    platform = new DesktopPlatform(fallbackTauriAPI);
  } else {
    platform = new DesktopPlatform(window.tauriAPI);
  }
  
  // Store the platform instance for future use
  // @ts-ignore - Added for backward compatibility
  window.__platformInstance = platform;
  
  return platform;
}

export default getPlatform();