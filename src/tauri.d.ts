declare module '@tauri-apps/api/core' {
  export function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

declare module '@tauri-apps/plugin-os' {
  export function platform(): Promise<string>;
  export function type(): Promise<string>;
  export function arch(): Promise<string>;
}

declare module '@tauri-apps/api/webviewWindow' {
  export class WebviewWindow {
    static getByLabel(label: string): WebviewWindow | null;
    constructor(label: string, options?: Record<string, unknown>);
    listen(event: string, handler: (event: any) => void): Promise<() => void>;
    emit(event: string, payload?: unknown): Promise<void>;
  }
}

declare module '@tauri-apps/plugin-store' {
  export class Store {
    constructor(filename: string);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    save(): Promise<void>;
    entries(): Promise<[string, unknown][]>;
  }
}

declare module '@tauri-apps/plugin-opener' {
  export function openPath(path: string): Promise<void>;
} 