import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  Settings, Moon, Sun, Languages, Key, Cpu, Bot, Github, Eye, EyeOff,
  Save, Palette, Globe, CheckCircle2, AlertCircle, ArrowLeftRight
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';

// 定义设置接口
interface AppSettings {
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    language: string;
  };
  api: {
    openAIKey: string;
    anthropicKey: string;
    googleAIKey: string;
    mastraEndpoint: string;
    localModels: boolean;
  };
  general: {
    autoSave: boolean;
    startupPage: 'chat' | 'market' | 'last';
    messageHistory: number;
    enableAnalytics: boolean;
    enableSync: boolean;
  };
  advanced: {
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    proxyServer: string;
    customStyles: string;
  };
}

// 默认设置
const defaultSettings: AppSettings = {
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    language: 'zh-CN',
  },
  api: {
    openAIKey: '',
    anthropicKey: '',
    googleAIKey: '',
    mastraEndpoint: 'http://localhost:3000/api',
    localModels: false,
  },
  general: {
    autoSave: true,
    startupPage: 'chat',
    messageHistory: 100,
    enableAnalytics: false,
    enableSync: false,
  },
  advanced: {
    logLevel: 'error',
    proxyServer: '',
    customStyles: '',
  }
};

// 语言选项
const languageOptions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'ko-KR', label: '한국어' },
  { value: 'es-ES', label: 'Español' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-DE', label: 'Deutsch' },
];

// 日志级别选项
const logLevelOptions = [
  { value: 'error', label: '错误' },
  { value: 'warn', label: '警告' },
  { value: 'info', label: '信息' },
  { value: 'debug', label: '调试' },
];

// 消息历史限制选项
const messageHistoryOptions = [
  { value: 50, label: '50 条消息' },
  { value: 100, label: '100 条消息' },
  { value: 200, label: '200 条消息' },
  { value: 500, label: '500 条消息' },
  { value: 1000, label: '1000 条消息' },
];

// 起始页面选项
const startupPageOptions = [
  { value: 'chat', label: '聊天页面' },
  { value: 'market', label: '智能体市场' },
  { value: 'last', label: '上次使用的页面' },
];

interface SettingsPageProps {
  onClose?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState(false);

  // 加载设置
  useEffect(() => {
    setLoading(true);
    // 这里应该从localStorage或后端API加载设置
    // 为演示目的，使用setTimeout模拟API调用
    setTimeout(() => {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error('Failed to parse settings:', e);
          setSettings(defaultSettings);
        }
      }
      setLoading(false);
    }, 300);
  }, []);

  // 保存设置
  const saveSettings = () => {
    setLoading(true);
    setSaved(false);
    setError(null);

    try {
      // 这里应该调用API保存设置
      // 为演示目的，使用localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      setTimeout(() => {
        setLoading(false);
        setSaved(true);
        // 2秒后清除保存状态
        setTimeout(() => setSaved(false), 2000);
      }, 500);
    } catch (err) {
      setLoading(false);
      setError('保存设置时出错。请稍后重试。');
    }
  };

  // 更新设置值
  const updateSettings = (
    category: keyof AppSettings,
    field: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
    setSaved(false);
  };

  // 重置为默认设置
  const resetSettings = () => {
    if (window.confirm('确定要重置所有设置到默认值吗？这个操作不可撤销。')) {
      setSettings(defaultSettings);
      setSaved(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 头部 */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h1 className="text-xl font-semibold">设置</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetSettings}>
            重置默认
          </Button>
          <Button 
            size="sm" 
            disabled={loading}
            onClick={saveSettings}
          >
            {loading ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 p-6 overflow-auto">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saved && (
          <Alert className="mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>已保存</AlertTitle>
            <AlertDescription>
              您的设置已成功保存。
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="appearance" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span>外观</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-1">
              <Key className="h-4 w-4" />
              <span>API设置</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>常规</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-1">
              <Cpu className="h-4 w-4" />
              <span>高级</span>
            </TabsTrigger>
          </TabsList>

          {/* 外观选项卡 */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>外观设置</CardTitle>
                <CardDescription>
                  自定义应用程序的视觉外观和本地化
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">主题</Label>
                  <Select
                    value={settings.appearance.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') =>
                      updateSettings('appearance', 'theme', value)
                    }
                  >
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="选择主题" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <span>浅色</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          <span>深色</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span>跟随系统</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-size">字体大小</Label>
                  <Select
                    value={settings.appearance.fontSize}
                    onValueChange={(value: 'small' | 'medium' | 'large') =>
                      updateSettings('appearance', 'fontSize', value)
                    }
                  >
                    <SelectTrigger id="font-size">
                      <SelectValue placeholder="选择字体大小" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">小</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="large">大</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">语言</Label>
                  <Select
                    value={settings.appearance.language}
                    onValueChange={(value) =>
                      updateSettings('appearance', 'language', value)
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="选择语言" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API设置选项卡 */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API设置</CardTitle>
                <CardDescription>
                  配置与AI模型提供商的API连接
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertTitle>API密钥安全</AlertTitle>
                  <AlertDescription>
                    您的API密钥仅存储在本地，不会被发送到任何服务器（除了相应的API提供商）。
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-end mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="text-xs flex items-center gap-1"
                  >
                    {showApiKeys ? (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>隐藏密钥</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>显示密钥</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="openai-key">OpenAI API密钥</Label>
                      <a
                        href="https://platform.openai.com/account/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        获取密钥
                      </a>
                    </div>
                    <Input
                      id="openai-key"
                      type={showApiKeys ? "text" : "password"}
                      placeholder="sk-..."
                      value={settings.api.openAIKey}
                      onChange={(e) =>
                        updateSettings("api", "openAIKey", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="anthropic-key">Anthropic API密钥</Label>
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        获取密钥
                      </a>
                    </div>
                    <Input
                      id="anthropic-key"
                      type={showApiKeys ? "text" : "password"}
                      placeholder="sk-ant-..."
                      value={settings.api.anthropicKey}
                      onChange={(e) =>
                        updateSettings("api", "anthropicKey", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="google-key">Google AI API密钥</Label>
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        获取密钥
                      </a>
                    </div>
                    <Input
                      id="google-key"
                      type={showApiKeys ? "text" : "password"}
                      placeholder="AIza..."
                      value={settings.api.googleAIKey}
                      onChange={(e) =>
                        updateSettings("api", "googleAIKey", e.target.value)
                      }
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <Label htmlFor="mastra-endpoint">Mastra 端点</Label>
                    <Input
                      id="mastra-endpoint"
                      placeholder="http://localhost:3000/api"
                      value={settings.api.mastraEndpoint}
                      onChange={(e) =>
                        updateSettings("api", "mastraEndpoint", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="local-models">本地模型支持</Label>
                      <p className="text-sm text-muted-foreground">
                        启用运行在本地的AI模型
                      </p>
                    </div>
                    <Switch
                      id="local-models"
                      checked={settings.api.localModels}
                      onCheckedChange={(checked) =>
                        updateSettings("api", "localModels", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 常规选项卡 */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>常规设置</CardTitle>
                <CardDescription>
                  配置应用程序的基本行为和功能
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">自动保存</Label>
                    <p className="text-sm text-muted-foreground">
                      自动保存聊天和设置
                    </p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={settings.general.autoSave}
                    onCheckedChange={(checked) =>
                      updateSettings("general", "autoSave", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startup-page">启动页面</Label>
                  <Select
                    value={settings.general.startupPage}
                    onValueChange={(value: 'chat' | 'market' | 'last') =>
                      updateSettings('general', 'startupPage', value)
                    }
                  >
                    <SelectTrigger id="startup-page">
                      <SelectValue placeholder="选择启动页面" />
                    </SelectTrigger>
                    <SelectContent>
                      {startupPageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message-history">消息历史限制</Label>
                  <Select
                    value={settings.general.messageHistory.toString()}
                    onValueChange={(value) =>
                      updateSettings('general', 'messageHistory', parseInt(value))
                    }
                  >
                    <SelectTrigger id="message-history">
                      <SelectValue placeholder="选择消息历史限制" />
                    </SelectTrigger>
                    <SelectContent>
                      {messageHistoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">启用使用分析</Label>
                    <p className="text-sm text-muted-foreground">
                      帮助我们改进应用程序体验（不含消息内容）
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={settings.general.enableAnalytics}
                    onCheckedChange={(checked) =>
                      updateSettings("general", "enableAnalytics", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync">启用云同步</Label>
                    <p className="text-sm text-muted-foreground">
                      在多设备间同步设置和智能体
                    </p>
                  </div>
                  <Switch
                    id="sync"
                    checked={settings.general.enableSync}
                    onCheckedChange={(checked) =>
                      updateSettings("general", "enableSync", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 高级选项卡 */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>高级设置</CardTitle>
                <CardDescription>
                  高级选项和调试设置（更改这些设置需小心）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="log-level">日志级别</Label>
                  <Select
                    value={settings.advanced.logLevel}
                    onValueChange={(value: 'error' | 'warn' | 'info' | 'debug') =>
                      updateSettings('advanced', 'logLevel', value)
                    }
                  >
                    <SelectTrigger id="log-level">
                      <SelectValue placeholder="选择日志级别" />
                    </SelectTrigger>
                    <SelectContent>
                      {logLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proxy-server">代理服务器</Label>
                  <Input
                    id="proxy-server"
                    placeholder="http://your-proxy-server:port"
                    value={settings.advanced.proxyServer}
                    onChange={(e) =>
                      updateSettings("advanced", "proxyServer", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    为API请求设置代理服务器，适用于需要绕过地区限制的情况
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-styles">自定义CSS</Label>
                  <Textarea
                    id="custom-styles"
                    placeholder="/* 自定义CSS样式 */"
                    rows={5}
                    className="font-mono text-sm"
                    value={settings.advanced.customStyles}
                    onChange={(e) =>
                      updateSettings("advanced", "customStyles", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    添加自定义CSS样式来修改应用程序外观
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={resetSettings}>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    重置所有设置为默认值
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    这将清除所有自定义设置，并恢复默认配置
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage; 