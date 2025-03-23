import { TauriAPI } from './shared/tauri-types';
import { DesktopPlatform } from './packages/platform';

declare global {
  interface Window {
    tauriAPI: TauriAPI;
    __platformInstance?: DesktopPlatform;
  }
}

export {}; 