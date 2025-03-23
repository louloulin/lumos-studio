# Migrating from Electron to Tauri

This document outlines the migration from Electron to Tauri for the Lumos Studio application.

## Overview

Tauri is a framework for building tiny, blazingly fast binaries for all major desktop platforms. Compared to Electron, Tauri applications are more secure, use less memory, and have a smaller bundle size.

## Key Changes

1. Added Tauri dependencies:
   - `@tauri-apps/api`
   - `@tauri-apps/plugin-store`
   - `@tauri-apps/plugin-opener`

2. Created TypeScript declaration files:
   - `src/tauri.d.ts` - Type declarations for Tauri packages
   - `src/window.d.ts` - Type declarations for window object
   - `src/shared/tauri-types.ts` - Interface definition for the Tauri API

3. Implemented a bridge in `src/shared/tauri-bridge.ts` to map Electron IPC calls to Tauri equivalents.

4. Exposed the Tauri bridge to the window object in `App.tsx`.

5. Updated Rust backend for Tauri 2.0:
   - Added plugin permissions in `tauri.conf.json`
   - Added required Rust plugin dependencies
   - Updated main.rs and lib.rs to initialize the Tauri plugins

## Current Issues and Solutions

### 1. WebviewWindow Reference Errors

**Issue**: The application fails when trying to access `WebviewWindow.getByLabel('main')` if the window isn't properly initialized.

**Solution**: 
- Implemented a robust try-catch pattern in `tauri-bridge.ts` to handle cases where the WebviewWindow isn't available
- Added fallback to document visibility events when window events aren't accessible:

```typescript
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
```

### 2. Store Initialization Issues

**Issue**: The Store functionality in Tauri works differently from Electron's store, leading to initialization problems and unhandled errors.

**Solution**:
- Implemented lazy loading for the Store to ensure it's only created when needed
- Added comprehensive error handling for all store operations
- Created fallback mechanisms when store operations fail:

```typescript
async function getStore(): Promise<Store | null> {
  if (!storePromise) {
    storePromise = new Promise(async (resolve, reject) => {
      try {
        const store = new Store('settings.dat');
        await store.load();
        resolve(store);
      } catch (e) {
        console.error('Failed to create Store:', e);
        reject(e);
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
```

### 3. Error Handling in Platform Functions

**Issue**: API calls to Tauri functions could fail without proper error handling, causing application crashes.

**Solution**:
- Added try-catch blocks to all platform function calls in `platform.ts`
- Implemented fallbacks for each function when errors occur:

```typescript
public async getLocale() {
  try {
    const locale = await this.tauriAPI.getLocale()
    return parseLocale(locale)
  } catch (e) {
    console.error('Failed to get locale:', e)
    return parseLocale(navigator.language)
  }
}
```

### 4. Port Conflicts During Development

**Issue**: The development server fails to start due to port 1420 already being in use.

**Solution**:
- Added script to check and kill processes using port 1420 before starting the development server
- Consider adding a dynamic port fallback mechanism

### 5. Type Issues with Config and Settings

**Issue**: The default implementations of Config and Settings are missing required properties, causing TypeScript errors.

**Next Steps**:
- Update the `getConfig()` method to return proper default values for required fields
- Update the `getSettings()` method similarly

## Usage

### Accessing Tauri API

The Tauri API is exposed through the `window.tauriAPI` object. This replaces the previous `window.electronAPI`.

```typescript
// Example: Get a value from the store
const value = await window.tauriAPI.getStoreValue('key');

// Example: Set a value in the store
await window.tauriAPI.setStoreValue('key', value);

// Example: Open a link
await window.tauriAPI.openLink('https://example.com');
```

### Storage

Tauri uses a different storage mechanism than Electron. The `@tauri-apps/plugin-store` is used to create a store instance that replaces electron-store.

```typescript
import { Store } from '@tauri-apps/plugin-store';

// Create a store instance
const store = new Store('settings.dat');

// Get a value
const value = await store.get('key');

// Set a value
await store.set('key', value);
await store.save();
```

### System Functions

Tauri provides access to system functions through various APIs:

```typescript
import { platform } from '@tauri-apps/api/os';
import { openPath } from '@tauri-apps/plugin-opener';

// Get the platform
const platformName = await platform();

// Open a file or URL
await openPath('/path/to/file');
```

## Tauri 2.0 Specific Changes

Tauri 2.0 uses a plugin-based architecture with a permissions system. The following plugins are used:

1. `tauri-plugin-os` - For OS-related functions like platform, hostname, etc.
2. `tauri-plugin-shell` - For running shell commands and opening URLs
3. `tauri-plugin-store` - For persistent storage
4. `tauri-plugin-window` - For window-related operations
5. `tauri-plugin-opener` - For opening files and URLs

Each plugin requires explicit permissions in the `tauri.conf.json` file.

### Event Handling

Unlike Electron's IPC system, Tauri uses a different approach for events:

```typescript
// Listen for window events
const mainWindow = WebviewWindow.getByLabel('main');
if (mainWindow) {
    mainWindow.once('show', () => {
        // Handle window show event
    });
    
    mainWindow.listen('custom-event', (event) => {
        // Handle custom event
    });
}

// Emit events
mainWindow.emit('custom-event', { data: 'value' });
```

### Rust Backend Configuration

The Rust backend needs to initialize all required plugins using the Builder pattern:

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_os::Builder::new().build())
    .plugin(tauri_plugin_shell::Builder::new().build())
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_opener::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
        // your commands here
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

## Next Steps

### Immediate Priorities:

1. **Fix Type Issues**:
   - Update default implementations of Config and Settings objects

2. **Remove Remaining Electron References**:
   - Update imports in remaining files that still reference Electron

3. **Enhance Error Handling**:
   - Add more robust error recovery mechanisms in key components

4. **Address Port Conflicts**:
   - Implement better development server port handling

### Medium-term Improvements:

1. **Optimize Performance**:
   - Profile and optimize application startup
   - Improve Store operations for better performance

2. **Enhance Native Features**:
   - Implement system tray functionality
   - Add proper window management with Tauri

3. **Improve Documentation**:
   - Update internal comments for Tauri-specific code
   - Create developer guidelines for Tauri best practices

## Migration Progress

### Frontend Changes:
1. Updated import paths:
   - Changed from `@tauri-apps/api/os` to `@tauri-apps/plugin-os`
   - Imported specific members from plugins: `{ platform, type, arch }` from `@tauri-apps/plugin-os`
   - Fixed opener import to use `openPath` from `@tauri-apps/plugin-opener`

2. Added robust error handling:
   - Improved store operations with try-catch blocks
   - Added fallbacks for platform functions
   - Implemented better initialization patterns

### Backend Changes:
1. Updated Cargo.toml:
   - Changed plugin dependencies from alpha versions to stable release versions:
     ```toml
     tauri-plugin-opener = "2.0.0"
     tauri-plugin-store = "2.0.0"
     tauri-plugin-os = "2.0.0"
     tauri-plugin-shell = "2.0.0"
     ```

2. Updated plugin initialization:
   - Changed from `.plugin(tauri_plugin_os::init())` to `.plugin(tauri_plugin_os::Builder::new().build())`
   - Applied the Builder pattern to all plugins

3. Fixed permissions in capabilities config:
   - Ensured correct permissions are set in `capabilities/default.json`:
     ```json
     "permissions": [
       "core:default",
       "opener:default",
       "store:default",
       "os:default",
       "shell:default",
       "core:window:default"
     ]
     ```

4. Installed necessary JavaScript packages:
   - Added `@tauri-apps/plugin-os`
   - Added `@tauri-apps/plugin-store`
   - Added `@tauri-apps/plugin-opener`
   - Added `@tauri-apps/plugin-shell`

These changes ensure proper integration between the Tauri 2.0 backend and the application frontend. 