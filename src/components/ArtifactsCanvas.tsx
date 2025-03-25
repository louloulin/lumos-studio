import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  PenLine, 
  Square, 
  Circle, 
  Type, 
  Image as ImageIcon, 
  Trash2, 
  Download, 
  Undo2, 
  Redo2, 
  Move,
  MousePointer,
  ChevronDown,
  Code
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { HexColorPicker } from 'react-colorful';

interface CanvasObject {
  id: string;
  type: 'path' | 'rect' | 'circle' | 'text' | 'image' | 'html' | 'svg';
  x: number;
  y: number;
  props: any;
}

interface ArtifactsCanvasProps {
  sessionId: string;
  readOnly?: boolean;
  initialObjects?: CanvasObject[];
  onObjectsChange?: (objects: CanvasObject[]) => void;
}

const ArtifactsCanvas: React.FC<ArtifactsCanvasProps> = ({
  sessionId,
  readOnly = false,
  initialObjects = [],
  onObjectsChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('draw');
  const [activeTool, setActiveTool] = useState<string>('pen');
  const [objects, setObjects] = useState<CanvasObject[]>(initialObjects);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [undoStack, setUndoStack] = useState<CanvasObject[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasObject[][]>([]);
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [svgCode, setSvgCode] = useState<string>('');

  // 初始化画布
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    // 设置画布大小为容器大小
    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawObjects();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);
  
  // 当对象变更时重绘
  useEffect(() => {
    drawObjects();
    
    // 通知外部变更
    if (onObjectsChange) {
      onObjectsChange(objects);
    }
  }, [objects]);
  
  // 渲染所有对象
  const drawObjects = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制所有对象
    objects.forEach(obj => {
      switch (obj.type) {
        case 'path':
          drawPath(ctx, obj);
          break;
        case 'rect':
          drawRect(ctx, obj);
          break;
        case 'circle':
          drawCircle(ctx, obj);
          break;
        case 'text':
          drawText(ctx, obj);
          break;
        case 'image':
          drawImage(ctx, obj);
          break;
        case 'html':
        case 'svg':
          // 这些将使用HTML元素渲染，不在canvas上绘制
          break;
      }
    });
  };
  
  // 绘制路径
  const drawPath = (ctx: CanvasRenderingContext2D, obj: CanvasObject) => {
    const { points, color, width } = obj.props;
    if (!points || points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.strokeStyle = color || '#000000';
    ctx.lineWidth = width || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  
  // 绘制矩形
  const drawRect = (ctx: CanvasRenderingContext2D, obj: CanvasObject) => {
    const { width, height, color, fill, strokeWidth } = obj.props;
    
    ctx.beginPath();
    if (fill) {
      ctx.fillStyle = color || '#000000';
      ctx.fillRect(obj.x, obj.y, width, height);
    } else {
      ctx.strokeStyle = color || '#000000';
      ctx.lineWidth = strokeWidth || 3;
      ctx.strokeRect(obj.x, obj.y, width, height);
    }
  };
  
  // 绘制圆形
  const drawCircle = (ctx: CanvasRenderingContext2D, obj: CanvasObject) => {
    const { radius, color, fill, strokeWidth } = obj.props;
    
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, radius, 0, Math.PI * 2);
    
    if (fill) {
      ctx.fillStyle = color || '#000000';
      ctx.fill();
    } else {
      ctx.strokeStyle = color || '#000000';
      ctx.lineWidth = strokeWidth || 3;
      ctx.stroke();
    }
  };
  
  // 绘制文本
  const drawText = (ctx: CanvasRenderingContext2D, obj: CanvasObject) => {
    const { text, fontSize, fontFamily, color } = obj.props;
    
    ctx.font = `${fontSize || 16}px ${fontFamily || 'Arial'}`;
    ctx.fillStyle = color || '#000000';
    ctx.fillText(text, obj.x, obj.y);
  };
  
  // 绘制图片
  const drawImage = (ctx: CanvasRenderingContext2D, obj: CanvasObject) => {
    const { src, width, height } = obj.props;
    
    const img = new Image();
    img.src = src;
    img.onload = () => {
      ctx.drawImage(img, obj.x, obj.y, width, height);
    };
  };

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    
    if (activeTool === 'pen') {
      setCurrentPath([{x, y}]);
    } else if (activeTool === 'rect') {
      // 创建新矩形，等待鼠标抬起完成
      const newObject: CanvasObject = {
        id: Date.now().toString(),
        type: 'rect',
        x,
        y,
        props: {
          width: 0,
          height: 0,
          color,
          fill: false,
          strokeWidth: brushSize
        }
      };
      setObjects(prev => [...prev, newObject]);
    } else if (activeTool === 'circle') {
      // 创建新圆形，等待鼠标抬起完成
      const newObject: CanvasObject = {
        id: Date.now().toString(),
        type: 'circle',
        x,
        y,
        props: {
          radius: 0,
          color,
          fill: false,
          strokeWidth: brushSize
        }
      };
      setObjects(prev => [...prev, newObject]);
    } else if (activeTool === 'text') {
      // 创建文本输入
      const text = prompt('输入文本:');
      if (text) {
        const newObject: CanvasObject = {
          id: Date.now().toString(),
          type: 'text',
          x,
          y,
          props: {
            text,
            fontSize: 16,
            fontFamily: 'Arial',
            color
          }
        };
        
        // 保存当前状态用于撤销
        setUndoStack(prev => [...prev, [...objects]]);
        setRedoStack([]);
        
        setObjects(prev => [...prev, newObject]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === 'pen') {
      // 更新当前路径
      setCurrentPath(prev => [...prev, {x, y}]);
      
      // 实时绘制临时路径
      const ctx = canvas.getContext('2d');
      if (ctx && currentPath.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    } else if (activeTool === 'rect' && objects.length > 0) {
      // 更新矩形大小
      const lastObject = {...objects[objects.length - 1]};
      if (lastObject.type === 'rect') {
        lastObject.props.width = x - lastObject.x;
        lastObject.props.height = y - lastObject.y;
        
        const updatedObjects = [...objects.slice(0, -1), lastObject];
        setObjects(updatedObjects);
      }
    } else if (activeTool === 'circle' && objects.length > 0) {
      // 更新圆形半径
      const lastObject = {...objects[objects.length - 1]};
      if (lastObject.type === 'circle') {
        const dx = x - lastObject.x;
        const dy = y - lastObject.y;
        lastObject.props.radius = Math.sqrt(dx * dx + dy * dy);
        
        const updatedObjects = [...objects.slice(0, -1), lastObject];
        setObjects(updatedObjects);
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || readOnly) return;
    
    // 保存当前状态用于撤销
    setUndoStack(prev => [...prev, [...objects]]);
    setRedoStack([]);
    
    if (activeTool === 'pen' && currentPath.length > 1) {
      // 完成路径绘制
      const newObject: CanvasObject = {
        id: Date.now().toString(),
        type: 'path',
        x: 0,
        y: 0,
        props: {
          points: [...currentPath],
          color,
          width: brushSize
        }
      };
      
      setObjects(prev => [...prev, newObject]);
    }
    
    setIsDrawing(false);
    setCurrentPath([]);
  };
  
  // 撤销操作
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const prevState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, [...objects]]);
    setObjects(prevState);
    setUndoStack(prev => prev.slice(0, -1));
  };
  
  // 重做操作
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, [...objects]]);
    setObjects(nextState);
    setRedoStack(prev => prev.slice(0, -1));
  };
  
  // 清空画布
  const handleClear = () => {
    if (objects.length === 0) return;
    
    // 保存当前状态用于撤销
    setUndoStack(prev => [...prev, [...objects]]);
    setObjects([]);
    setRedoStack([]);
  };
  
  // 导出为图片
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `artifacts-${sessionId}-${new Date().toISOString()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  // 添加HTML内容
  const handleAddHTML = () => {
    if (!htmlCode.trim()) return;
    
    const newObject: CanvasObject = {
      id: Date.now().toString(),
      type: 'html',
      x: 50,
      y: 50,
      props: {
        content: htmlCode,
        width: 300,
        height: 200
      }
    };
    
    // 保存当前状态用于撤销
    setUndoStack(prev => [...prev, [...objects]]);
    setRedoStack([]);
    
    setObjects(prev => [...prev, newObject]);
    setHtmlCode('');
  };
  
  // 添加SVG内容
  const handleAddSVG = () => {
    if (!svgCode.trim()) return;
    
    const newObject: CanvasObject = {
      id: Date.now().toString(),
      type: 'svg',
      x: 50,
      y: 50,
      props: {
        content: svgCode,
        width: 300,
        height: 200
      }
    };
    
    // 保存当前状态用于撤销
    setUndoStack(prev => [...prev, [...objects]]);
    setRedoStack([]);
    
    setObjects(prev => [...prev, newObject]);
    setSvgCode('');
  };

  return (
    <div className="flex flex-col h-full bg-background border rounded-md overflow-hidden">
      {/* 工具栏 */}
      {!readOnly && (
        <>
          <div className="p-2 border-b flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="draw">绘图</TabsTrigger>
                <TabsTrigger value="code">代码</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleUndo} 
                disabled={undoStack.length === 0}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRedo} 
                disabled={redoStack.length === 0}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClear} 
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <TabsContent value="draw" className="p-2 border-b flex flex-wrap items-center gap-2 m-0">
            <Button 
              variant={activeTool === 'select' ? "secondary" : "outline"} 
              size="icon" 
              onClick={() => setActiveTool('select')}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button 
              variant={activeTool === 'pen' ? "secondary" : "outline"} 
              size="icon" 
              onClick={() => setActiveTool('pen')}
            >
              <PenLine className="h-4 w-4" />
            </Button>
            <Button 
              variant={activeTool === 'rect' ? "secondary" : "outline"} 
              size="icon" 
              onClick={() => setActiveTool('rect')}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button 
              variant={activeTool === 'circle' ? "secondary" : "outline"} 
              size="icon" 
              onClick={() => setActiveTool('circle')}
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button 
              variant={activeTool === 'text' ? "secondary" : "outline"} 
              size="icon" 
              onClick={() => setActiveTool('text')}
            >
              <Type className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-8" />
            
            <div className="relative">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowColorPicker(!showColorPicker)}
                style={{ backgroundColor: color }}
              >
                <span className="sr-only">选择颜色</span>
              </Button>
              
              {showColorPicker && (
                <div className="absolute z-10 mt-2 shadow-lg bg-background border rounded-md p-2">
                  <HexColorPicker color={color} onChange={setColor} />
                  <div className="flex mt-2">
                    <Input 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)} 
                      className="w-full px-2 py-1"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              <Label htmlFor="brush-size" className="text-xs">粗细:</Label>
              <Slider
                id="brush-size"
                min={1}
                max={20}
                step={1}
                value={[brushSize]}
                onValueChange={(value) => setBrushSize(value[0])}
                className="w-20"
              />
              <span className="text-xs">{brushSize}px</span>
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="p-2 border-b flex-col gap-2 m-0">
            <div className="flex items-center mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddHTML}
                className="mr-2"
              >
                添加HTML
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddSVG}
              >
                添加SVG
              </Button>
            </div>
            
            <Tabs defaultValue="html" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="svg">SVG</TabsTrigger>
              </TabsList>
              
              <TabsContent value="html" className="m-0">
                <textarea
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  placeholder="<div>输入HTML代码...</div>"
                  className="w-full h-24 p-2 border rounded font-mono text-sm"
                />
              </TabsContent>
              
              <TabsContent value="svg" className="m-0">
                <textarea
                  value={svgCode}
                  onChange={(e) => setSvgCode(e.target.value)}
                  placeholder="<svg>输入SVG代码...</svg>"
                  className="w-full h-24 p-2 border rounded font-mono text-sm"
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </>
      )}
      
      {/* 画布区域 */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 bg-white"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* HTML和SVG内容渲染层 */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {objects.filter(obj => obj.type === 'html' || obj.type === 'svg').map(obj => (
            <div
              key={obj.id}
              className="absolute border border-dashed border-gray-300"
              style={{
                left: `${obj.x}px`,
                top: `${obj.y}px`,
                width: `${obj.props.width}px`,
                height: `${obj.props.height}px`,
                pointerEvents: readOnly ? 'none' : 'auto'
              }}
            >
              {obj.type === 'html' && (
                <div dangerouslySetInnerHTML={{ __html: obj.props.content }} />
              )}
              
              {obj.type === 'svg' && (
                <div dangerouslySetInnerHTML={{ __html: obj.props.content }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArtifactsCanvas; 