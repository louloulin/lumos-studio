import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Excalidraw, exportToSvg, THEME } from '@excalidraw/excalidraw';
import { useAtom } from 'jotai';
import { whiteboardAtom, updateWhiteboardState } from '../stores/whiteboardStore';
import { Button } from './ui/button';
import { Download, Share, Trash2, Undo, Redo } from 'lucide-react';
import { toast } from './ui/use-toast';

// 导入基本样式
import './whiteboard.css';

interface WhiteboardWithExcalidrawProps {
  onSendToChat?: (svgString: string) => void;
}

const WhiteboardWithExcalidraw: React.FC<WhiteboardWithExcalidrawProps> = ({ onSendToChat }) => {
  const [whiteboardState] = useAtom(whiteboardAtom);
  const [viewModeEnabled, setViewModeEnabled] = useState<boolean>(whiteboardState.viewMode === 'presentation');
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 当元素变化时保存到状态
  const handleChange = useCallback((elements: any) => {
    updateWhiteboardState({
      elements: elements
    });
  }, []);

  // 确保白板组件加载后获得焦点并处理锁图标问题
  useEffect(() => {
    if (containerRef.current) {
      setTimeout(() => {
        containerRef.current?.focus();
        
        // 触发一个点击事件以确保正确初始化
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        containerRef.current?.dispatchEvent(clickEvent);
        
        // 尝试通过DOM操作隐藏锁图标
        const lockElements = document.querySelectorAll('.CollabButton--lock, [data-testid="lock-button"]');
        lockElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.display = 'none';
          }
        });
      }, 200);
    }
  }, [excalidrawAPI]);

  // 导出为SVG并保存
  const exportAsSvg = async () => {
    if (!excalidrawAPI) return;
    
    try {
      const svgElement = await exportToSvg({
        elements: excalidrawAPI.getSceneElements(),
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
      });
      
      // 创建一个Blob对象
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: '导出成功',
        description: 'SVG文件已下载',
      });
    } catch (error) {
      console.error('导出SVG失败:', error);
      toast({
        title: '导出失败',
        description: '无法导出SVG文件',
        variant: 'destructive',
      });
    }
  };

  // 分享到聊天
  const shareToChat = async () => {
    if (!excalidrawAPI || !onSendToChat) return;
    
    try {
      const svgElement = await exportToSvg({
        elements: excalidrawAPI.getSceneElements(),
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
      });
      
      const svgString = new XMLSerializer().serializeToString(svgElement);
      onSendToChat(svgString);
      
      toast({
        title: '分享成功',
        description: '白板内容已分享到聊天',
      });
    } catch (error) {
      console.error('分享到聊天失败:', error);
      toast({
        title: '分享失败',
        description: '无法分享白板内容到聊天',
        variant: 'destructive',
      });
    }
  };

  // 清除白板
  const clearWhiteboard = () => {
    if (!excalidrawAPI) return;
    
    excalidrawAPI.resetScene();
    updateWhiteboardState({
      elements: []
    });
    
    toast({
      title: '白板已清除',
      description: '所有内容已被删除',
    });
  };

  // 切换查看模式
  const toggleViewMode = () => {
    const newViewMode = viewModeEnabled ? 'default' : 'presentation';
    setViewModeEnabled(!viewModeEnabled);
    updateWhiteboardState({
      viewMode: newViewMode
    });
  };

  // 撤销操作
  const handleUndo = () => {
    if (excalidrawAPI) {
      excalidrawAPI.history.undo();
    }
  };

  // 重做操作
  const handleRedo = () => {
    if (excalidrawAPI) {
      excalidrawAPI.history.redo();
    }
  };

  // 重新激活白板
  const handleActivateBoard = () => {
    if (containerRef.current) {
      containerRef.current.focus();
      if (excalidrawAPI) {
        // 重新设置场景可以触发重新渲染
        excalidrawAPI.updateScene({
          elements: excalidrawAPI.getSceneElements()
        });
      }
    }
  };

  // 清除锁图标的dom元素
  const removeLockIcons = () => {
    setTimeout(() => {
      const lockElements = document.querySelectorAll('.CollabButton--lock, [data-testid="lock-button"]');
      lockElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      });
    }, 100);
  };

  return (
    <div 
      className="flex flex-col h-full border rounded-md overflow-hidden"
      ref={containerRef}
      tabIndex={0}
      onClick={handleActivateBoard}
    >
      {/* 工具栏 */}
      <div className="flex justify-between items-center p-2 border-b">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleUndo}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRedo}>
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={clearWhiteboard}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={toggleViewMode}>
            {viewModeEnabled ? '编辑模式' : '演示模式'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportAsSvg}>
            <Download className="h-4 w-4" />
          </Button>
          {onSendToChat && (
            <Button variant="outline" size="sm" onClick={shareToChat}>
              <Share className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Excalidraw组件 */}
      <div className="flex-1 relative whiteboard-container" onMouseEnter={removeLockIcons} onTouchStart={removeLockIcons}>
        <Excalidraw
          initialData={{
            elements: whiteboardState.elements || [],
            appState: { 
              viewBackgroundColor: '#ffffff',
              theme: THEME.LIGHT,
              isLoading: false
            },
            scrollToContent: true
          }}
          onChange={handleChange}
          excalidrawAPI={api => {
            setExcalidrawAPI(api);
            removeLockIcons();
          }}
          autoFocus={true}
          UIOptions={{
            canvasActions: {
              clearCanvas: true,
              loadScene: true,
              saveAsImage: true,
              saveToActiveFile: true,
              toggleTheme: true
            },
            tools: {
              image: true
            }
          }}
          viewModeEnabled={viewModeEnabled}
        />
      </div>
    </div>
  );
};

export default WhiteboardWithExcalidraw; 