import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Paintbrush2, Image, FileText, Upload, Share2 } from 'lucide-react';

// 定义组件属性
interface ArtifactsTabProps {
  onShareArtifact: (artifactData: any) => void;
}

// 定义工件类型
interface Artifact {
  id: string;
  type: 'canvas' | 'image' | 'text';
  title: string;
  preview: string;
  dataUrl?: string;
  content?: string;
  timestamp: Date;
}

// 工件标签组件
const ArtifactsTab: React.FC<ArtifactsTabProps> = ({ onShareArtifact }) => {
  const [canvasArtifacts, setCanvasArtifacts] = useState<Artifact[]>([]);
  const [imageArtifacts, setImageArtifacts] = useState<Artifact[]>([]);
  const [textArtifacts, setTextArtifacts] = useState<Artifact[]>([]);

  // 模拟从本地存储加载工件
  useEffect(() => {
    // 从localStorage或其他存储中获取数据
    const loadArtifacts = () => {
      try {
        // 这里应当是从实际存储中加载数据
        // 示例数据
        const mockCanvasArtifacts: Artifact[] = [
          {
            id: 'canvas1',
            type: 'canvas',
            title: '白板草图 1',
            preview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            timestamp: new Date(Date.now() - 1000 * 60 * 30)
          },
          {
            id: 'canvas2',
            type: 'canvas',
            title: '白板草图 2',
            preview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            timestamp: new Date(Date.now() - 1000 * 60 * 20)
          }
        ];
        
        const mockImageArtifacts: Artifact[] = [
          {
            id: 'image1',
            type: 'image',
            title: '图像 1',
            preview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            timestamp: new Date(Date.now() - 1000 * 60 * 15)
          }
        ];
        
        const mockTextArtifacts: Artifact[] = [
          {
            id: 'text1',
            type: 'text',
            title: '笔记 1',
            preview: '这是一段示例笔记内容...',
            content: '这是一段示例笔记内容，可以包含更多的文本信息。用户可以在白板或其他区域创建的文本内容会被保存在这里。',
            timestamp: new Date(Date.now() - 1000 * 60 * 10)
          }
        ];
        
        setCanvasArtifacts(mockCanvasArtifacts);
        setImageArtifacts(mockImageArtifacts);
        setTextArtifacts(mockTextArtifacts);
      } catch (error) {
        console.error('Failed to load artifacts:', error);
      }
    };
    
    loadArtifacts();
  }, []);

  // 分享工件到聊天
  const handleShareArtifact = (artifact: Artifact) => {
    switch (artifact.type) {
      case 'canvas':
        onShareArtifact({
          type: 'canvas',
          dataUrl: artifact.dataUrl
        });
        break;
      case 'image':
        onShareArtifact({
          type: 'image',
          dataUrl: artifact.dataUrl
        });
        break;
      case 'text':
        onShareArtifact({
          type: 'text',
          content: artifact.content
        });
        break;
      default:
        console.error('Unknown artifact type:', artifact.type);
    }
  };

  // 时间格式化
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 渲染单个工件卡片
  const renderArtifactCard = (artifact: Artifact) => (
    <Card key={artifact.id} className="mb-3 overflow-hidden">
      <div className="relative">
        {artifact.type === 'text' ? (
          <div className="p-3 bg-secondary/10 h-28 overflow-hidden">
            <p className="text-sm line-clamp-5">{artifact.preview}</p>
          </div>
        ) : (
          <div className="relative h-28 bg-secondary/10">
            <img 
              src={artifact.preview} 
              alt={artifact.title}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        
        <div className="p-2 bg-card flex justify-between items-center">
          <div>
            <h4 className="text-sm font-medium truncate">{artifact.title}</h4>
            <span className="text-xs text-muted-foreground">
              {formatTime(artifact.timestamp)}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => handleShareArtifact(artifact)}
          >
            <Share2 size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="canvas">
        <div className="border-b px-2">
          <TabsList className="h-9 w-full justify-start space-x-2">
            <TabsTrigger value="canvas" className="text-xs px-2 py-1">
              <Paintbrush2 className="mr-1 h-3.5 w-3.5" />
              白板
            </TabsTrigger>
            <TabsTrigger value="images" className="text-xs px-2 py-1">
              <Image className="mr-1 h-3.5 w-3.5" />
              图像
            </TabsTrigger>
            <TabsTrigger value="text" className="text-xs px-2 py-1">
              <FileText className="mr-1 h-3.5 w-3.5" />
              文本
            </TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3">
            <TabsContent value="canvas" className="mt-0">
              <div className="space-y-3">
                {canvasArtifacts.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    <Paintbrush2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">没有白板内容</p>
                    <p className="text-xs mt-1">在白板创建的内容将显示在这里</p>
                  </div>
                ) : (
                  canvasArtifacts.map(renderArtifactCard)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="images" className="mt-0">
              <div className="space-y-3">
                {imageArtifacts.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    <Image className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">没有图像</p>
                    <p className="text-xs mt-1">上传的图像将显示在这里</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      上传图像
                    </Button>
                  </div>
                ) : (
                  imageArtifacts.map(renderArtifactCard)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="mt-0">
              <div className="space-y-3">
                {textArtifacts.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">没有文本内容</p>
                    <p className="text-xs mt-1">创建的笔记和文本将显示在这里</p>
                  </div>
                ) : (
                  textArtifacts.map(renderArtifactCard)
                )}
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default ArtifactsTab; 