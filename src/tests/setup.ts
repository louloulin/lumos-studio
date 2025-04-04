/**
 * 测试环境设置文件
 */

import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// 创建一个全局DOM环境
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

// 设置全局变量
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.localStorage = dom.window.localStorage;
global.sessionStorage = dom.window.sessionStorage;
global.CustomEvent = dom.window.CustomEvent;

// 模拟console方法以避免测试输出过于冗长
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// 在所有测试执行前
beforeAll(() => {
  // 在这里可以添加全局测试设置
});

// 在每个测试执行后
afterEach(() => {
  vi.restoreAllMocks();
});

// 在所有测试执行后
afterAll(() => {
  // 在这里可以添加全局测试清理
}); 