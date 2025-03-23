import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { clearAllCache } from '@/utils/clearCache';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件，用于捕获子组件中的JavaScript错误
 * 防止整个应用崩溃，并提供恢复选项
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新状态，下次渲染时显示错误UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 可以在这里记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo,
    });
  }
  
  handleReset = async () => {
    try {
      // 清理所有缓存
      await clearAllCache();
      
      // 刷新页面
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset application:', e);
      // 如果清理缓存失败，直接刷新页面
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      // 自定义回退UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // 默认错误UI
      return (
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <div className="max-w-md p-6 bg-muted rounded-lg text-center">
            <h2 className="text-xl font-bold mb-2">应用发生错误</h2>
            <p className="text-sm text-muted-foreground mb-4">
              应用出现了意外错误，可能是由于数据损坏或访问权限问题导致的。
            </p>
            
            {/* 错误详情（仅开发环境显示） */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 mb-4 p-2 bg-destructive/10 rounded text-left overflow-auto max-h-[200px] text-xs">
                <p className="font-medium">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
            
            <Button 
              onClick={this.handleReset}
              variant="default"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              清理所有缓存并重启
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 