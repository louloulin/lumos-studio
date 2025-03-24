import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PenTool, 
  MessageSquare, 
  Bot, 
  BarChart, 
  FileText, 
  Settings, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动设备以调整UI
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 主要功能卡片数据
  const features = [
    {
      title: '智能白板',
      description: '使用智能白板进行创意绘图和头脑风暴，支持AI分析您的绘图内容。',
      icon: <PenTool className="h-12 w-12 mb-4 text-blue-500" />,
      path: '/whiteboard',
      color: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'AI 聊天助手',
      description: '与智能助手进行对话，获取信息、解答问题或简单闲聊。',
      icon: <MessageSquare className="h-12 w-12 mb-4 text-green-500" />,
      path: '#chat',
      color: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: '智能体市场',
      description: '探索和使用专门为不同任务训练的AI智能体。',
      icon: <Bot className="h-12 w-12 mb-4 text-purple-500" />,
      path: '#market', 
      color: 'bg-purple-50 dark:bg-purple-950'
    },
    {
      title: '数据分析',
      description: '上传和分析您的数据，获取AI驱动的见解和可视化。',
      icon: <BarChart className="h-12 w-12 mb-4 text-orange-500" />,
      path: '#data-analysis',
      color: 'bg-orange-50 dark:bg-orange-950'
    },
    {
      title: '文档助手',
      description: '创建、编辑和分析文档，智能总结和生成报告。',
      icon: <FileText className="h-12 w-12 mb-4 text-red-500" />,
      path: '#docs',
      color: 'bg-red-50 dark:bg-red-950'
    },
    {
      title: '设置',
      description: '自定义应用设置，管理API密钥和个人偏好。',
      icon: <Settings className="h-12 w-12 mb-4 text-gray-500" />,
      path: '#settings',
      color: 'bg-gray-50 dark:bg-gray-900'
    }
  ];

  // 处理卡片点击
  const handleCardClick = (path: string) => {
    if (path.startsWith('#')) {
      // 内部导航，暂时触发一个提示
      alert('该功能即将上线，敬请期待！');
    } else {
      // 路由导航
      navigate(path);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="flex justify-between items-center px-4 py-3 border-b">
        <Link to="/" className="flex items-center space-x-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span className="text-xl font-bold">Lumos Studio</span>
        </Link>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      {/* 主要内容 */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 欢迎区 */}
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3">欢迎使用 Lumos Studio</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            智能助手帮您提高工作效率、激发创造力，探索以下功能开始您的AI之旅。
          </p>
        </section>
        
        {/* 白板快速访问 */}
        <section className="mb-12">
          <div className="rounded-lg overflow-hidden border border-border bg-primary/5 p-6 flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-6 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-3">智能白板</h2>
              <p className="text-muted-foreground mb-4 max-w-xl">
                通过直观的白板界面进行头脑风暴、创建图表和设计草图。AI助手可以理解并分析您的绘图内容，提供实时反馈。
              </p>
              <Button onClick={() => navigate('/whiteboard')} size="lg">
                打开白板
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="relative w-full md:w-1/3 h-48 md:h-64 bg-primary-foreground/10 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <PenTool className="h-16 w-16 text-primary opacity-30" />
              </div>
            </div>
          </div>
        </section>
        
        {/* 功能卡片 */}
        <section>
          <h2 className="text-2xl font-bold mb-6">探索功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${feature.path === '/whiteboard' ? 'border-primary/30' : ''}`}
                onClick={() => handleCardClick(feature.path)}
              >
                <CardHeader className={`rounded-t-lg ${feature.color}`}>
                  <div className="flex justify-center">
                    {feature.icon}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <CardTitle className="mb-2">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={feature.path === '/whiteboard' ? 'default' : 'secondary'} 
                    className="w-full"
                  >
                    {feature.path === '/whiteboard' ? '立即使用' : '了解更多'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>
      
      {/* 页脚 */}
      <footer className="border-t py-4 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Lumos Studio. 保留所有权利。</p>
      </footer>
    </div>
  );
};

export default HomePage; 