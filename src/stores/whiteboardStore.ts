import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { v4 as uuidv4 } from 'uuid';

// 白板状态类型定义
export interface WhiteboardState {
  sessionId: string;
  agentId: string;
  elements: any[];
  viewMode: 'default' | 'presentation';
}

// 初始状态
const initialState: WhiteboardState = {
  sessionId: uuidv4(),
  agentId: 'agent', // 默认智能体
  elements: [],
  viewMode: 'default',
};

// 确保白板状态的完整性
export const ensureWhiteboardState = (state: Partial<WhiteboardState> | null | undefined): WhiteboardState => {
  if (!state) return { ...initialState };
  
  return {
    sessionId: state.sessionId || uuidv4(),
    agentId: state.agentId || 'agent',
    elements: Array.isArray(state.elements) ? state.elements : [],
    viewMode: state.viewMode === 'presentation' ? 'presentation' : 'default',
  };
};

// 安全的从localStorage读取数据，确保有默认值
const getStoredState = (): WhiteboardState => {
  try {
    const stored = localStorage.getItem('whiteboard_state');
    if (!stored) return initialState;
    
    const parsed = JSON.parse(stored);
    return ensureWhiteboardState(parsed);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return initialState;
  }
};

// 创建白板状态原子 - 使用默认的atomWithStorage
export const whiteboardAtom = atom<WhiteboardState>(getStoredState());

// 订阅atom变化，写入localStorage
export const setupWhiteboardPersistence = (onChange: (state: WhiteboardState) => void) => {
  window.addEventListener('storage', (event) => {
    if (event.key === 'whiteboard_state' && event.newValue) {
      try {
        const newState = JSON.parse(event.newValue);
        onChange(ensureWhiteboardState(newState));
      } catch (error) {
        console.error('Error parsing localStorage change:', error);
      }
    }
  });
};

// 更新白板状态的函数
export const updateWhiteboardState = (state: Partial<WhiteboardState>): WhiteboardState => {
  try {
    // 获取当前状态
    const currentState = getStoredState();
    // 合并新状态
    const newState = { ...currentState, ...state };
    // 存储到localStorage
    localStorage.setItem('whiteboard_state', JSON.stringify(newState));
    return newState;
  } catch (error) {
    console.error('Error updating whiteboard state:', error);
    // 如果出错，仍然返回有效的状态
    return { ...initialState, ...state };
  }
};

// 钩子函数用于在组件中使用白板状态
export const useWhiteboardStore = () => {
  // 由于我们没有使用React Hook的Context，这里简单返回当前状态
  // 实际使用时，组件会通过jotai的useAtom或useAtomValue访问状态
  return {
    ...initialState,
    // 这些方法会在组件中通过jotai的useSetAtom实现
    setAgentId: (agentId: string) => {},
    setElements: (elements: any[]) => {},
    setViewMode: (viewMode: 'default' | 'presentation') => {},
    resetSession: () => {},
  };
}; 