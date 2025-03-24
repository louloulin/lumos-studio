import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ArtifactsCanvas from './ArtifactsCanvas';
import { Button } from './ui/button';
import { Paintbrush2, Code } from 'lucide-react';

interface ArtifactsTabProps {
  sessionId: string;
  onShareArtifact?: (artifactData: any) => void;
}

const ArtifactsTab: React.FC<ArtifactsTabProps> = ({
  sessionId,
  onShareArtifact
}) => {
  const [activeTab, setActiveTab] = useState<string>('canvas');
  const [canvasObjects, setCanvasObjects] = useState<any[]>([]);

  // 分享画布内容到对话
  const handleShareCanvas = () => {
    if (onShareArtifact && canvasObjects.length > 0) {
      // 创建画布快照
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 设置画布大小
      canvas.width = 800;
      canvas.height = 600;
      
      // 绘制所有对象
      // 这里需要实现一个将对象绘制到新画布的逻辑
      // 简化版本：生成数据URI
      const dataUrl = canvas.toDataURL('image/png');
      
      onShareArtifact({
        type: 'canvas',
        dataUrl,
        objects: canvasObjects
      });
    }
  };

  // 分享HTML/SVG内容到对话
  const handleShareCode = () => {
    if (onShareArtifact) {
      // 查找HTML/SVG对象
      const htmlObjects = canvasObjects.filter(obj => obj.type === 'html' || obj.type === 'svg');
      
      if (htmlObjects.length > 0) {
        onShareArtifact({
          type: 'code',
          content: htmlObjects.map(obj => obj.props.content).join('\n\n')
        });
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="canvas" className="flex items-center gap-2">
              <Paintbrush2 className="h-4 w-4" />
              白板
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              代码视图
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <TabsContent value="canvas" className="h-full m-0 p-0">
          <ArtifactsCanvas 
            sessionId={sessionId}
            onObjectsChange={setCanvasObjects}
          />
        </TabsContent>
        
        <TabsContent value="code" className="h-full m-0 p-4">
          <div className="h-full overflow-auto">
            <h3 className="text-lg font-medium mb-4">HTML/SVG 代码内容</h3>
            
            {canvasObjects.filter(obj => obj.type === 'html' || obj.type === 'svg').length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <p>尚未添加任何HTML或SVG内容</p>
                <p className="text-sm mt-2">切换到白板标签，添加HTML或SVG内容</p>
              </div>
            ) : (
              <div className="space-y-4">
                {canvasObjects
                  .filter(obj => obj.type === 'html' || obj.type === 'svg')
                  .map((obj, index) => (
                    <div key={obj.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">
                          {obj.type === 'html' ? 'HTML内容' : 'SVG内容'} #{index + 1}
                        </h4>
                      </div>
                      <pre className="bg-muted p-3 rounded-md text-sm overflow-auto">
                        <code>{obj.props.content}</code>
                      </pre>
                      <div className="mt-3 p-3 border rounded-md bg-background">
                        <div 
                          dangerouslySetInnerHTML={{ __html: obj.props.content }}
                          className="w-full overflow-auto"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </TabsContent>
      </div>
      
      <div className="border-t p-3 flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleShareCanvas}
          disabled={canvasObjects.length === 0}
        >
          分享画布到对话
        </Button>
        <Button 
          variant="default" 
          onClick={handleShareCode}
          disabled={canvasObjects.filter(obj => obj.type === 'html' || obj.type === 'svg').length === 0}
        >
          分享代码到对话
        </Button>
      </div>
    </div>
  );
};

export default ArtifactsTab; 