import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tsconfigPaths()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // 添加代理配置，解决跨域问题
    proxy: {
      '/api': {
        target: 'http://localhost:4111',
        changeOrigin: true,
        secure: false,
        ws: true,
        // 移除路径前缀，因为Mastra服务器已经包含/api路径
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('正在发送请求:', req.method, req.url);
            // 保留自定义头部
            if (req.headers['x-mastra-client-type']) {
              proxyReq.setHeader('x-mastra-client-type', req.headers['x-mastra-client-type']);
            }
            if (req.headers['x-mastra-client-id']) {
              proxyReq.setHeader('x-mastra-client-id', req.headers['x-mastra-client-id']);
            }
          });
        }
      }
    }
  },
  // 添加路径别名配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}));
