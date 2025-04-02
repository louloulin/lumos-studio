import React, { useEffect, useState } from 'react';
import { Button, Card, Input, Select, Switch, message } from 'antd';
import { SearchOutlined, DownloadOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { Plugin, PluginStatus } from '../api/types/plugin';
import { pluginManager } from '../api/PluginManager';

const { Search } = Input;
const { Option } = Select;

interface PluginCardProps {
  plugin: Plugin;
  onInstall: (id: string) => Promise<void>;
  onUninstall: (id: string) => Promise<void>;
  onEnable: (id: string) => Promise<void>;
  onDisable: (id: string) => Promise<void>;
  onConfigure: (id: string) => void;
}

const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  onInstall,
  onUninstall,
  onEnable,
  onDisable,
  onConfigure,
}) => {
  const isInstalled = plugin.status !== undefined;
  const isEnabled = plugin.enabled;

  const handleStatusChange = async (checked: boolean) => {
    try {
      if (checked) {
        await onEnable(plugin.id);
      } else {
        await onDisable(plugin.id);
      }
    } catch (error) {
      message.error(`Failed to ${checked ? 'enable' : 'disable'} plugin: ${error}`);
    }
  };

  return (
    <Card
      title={plugin.name}
      extra={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isInstalled && (
            <>
              <Switch
                checked={isEnabled}
                onChange={handleStatusChange}
                disabled={plugin.status === PluginStatus.Error}
              />
              <Button
                icon={<SettingOutlined />}
                onClick={() => onConfigure(plugin.id)}
                disabled={!isEnabled}
              />
              <Button
                icon={<DeleteOutlined />}
                onClick={() => onUninstall(plugin.id)}
                danger
              />
            </>
          )}
          {!isInstalled && (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => onInstall(plugin.id)}
            >
              Install
            </Button>
          )}
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      <p>{plugin.description}</p>
      <div style={{ marginTop: 8 }}>
        <small>
          Version: {plugin.version}
          {plugin.author && ` • Author: ${plugin.author}`}
        </small>
      </div>
    </Card>
  );
};

const PluginMarketPage: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // 加载插件列表
  const loadPlugins = async () => {
    try {
      setLoading(true);
      // TODO: 从插件市场API获取插件列表
      const marketPlugins: Plugin[] = [];
      const installedPlugins = pluginManager.getAllPlugins();
      
      // 合并市场插件和已安装插件的信息
      const mergedPlugins = marketPlugins.map(plugin => {
        const installedPlugin = installedPlugins.find(p => p.id === plugin.id);
        return installedPlugin || plugin;
      });
      
      setPlugins(mergedPlugins);
    } catch (error) {
      message.error('Failed to load plugins');
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  // 处理插件安装
  const handleInstall = async (id: string) => {
    try {
      await pluginManager.install(id);
      message.success('Plugin installed successfully');
      await loadPlugins();
    } catch (error) {
      message.error('Failed to install plugin');
      console.error('Failed to install plugin:', error);
    }
  };

  // 处理插件卸载
  const handleUninstall = async (id: string) => {
    try {
      await pluginManager.uninstall(id);
      message.success('Plugin uninstalled successfully');
      await loadPlugins();
    } catch (error) {
      message.error('Failed to uninstall plugin');
      console.error('Failed to uninstall plugin:', error);
    }
  };

  // 处理插件启用
  const handleEnable = async (id: string) => {
    try {
      await pluginManager.enable(id);
      message.success('Plugin enabled successfully');
      await loadPlugins();
    } catch (error) {
      message.error('Failed to enable plugin');
      console.error('Failed to enable plugin:', error);
    }
  };

  // 处理插件禁用
  const handleDisable = async (id: string) => {
    try {
      await pluginManager.disable(id);
      message.success('Plugin disabled successfully');
      await loadPlugins();
    } catch (error) {
      message.error('Failed to disable plugin');
      console.error('Failed to disable plugin:', error);
    }
  };

  // 处理插件配置
  const handleConfigure = (id: string) => {
    // TODO: 打开插件配置对话框
    message.info('Plugin configuration dialog will be implemented soon');
  };

  // 过滤插件列表
  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = 
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === 'all' || 
      plugin.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // 获取所有可用的插件类别
  const categories = Array.from(
    new Set(plugins.map(plugin => plugin.category).filter(Boolean))
  );

  return (
    <div style={{ padding: 24 }}>
      <h1>Plugin Market</h1>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Search
          placeholder="Search plugins..."
          allowClear
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        
        <Select
          defaultValue="all"
          style={{ width: 200 }}
          onChange={(value: string) => setCategoryFilter(value)}
        >
          <Option value="all">All Categories</Option>
          {categories.map(category => (
            <Option key={category} value={category}>
              {category}
            </Option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div>Loading plugins...</div>
      ) : (
        <div>
          {filteredPlugins.map(plugin => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onInstall={handleInstall}
              onUninstall={handleUninstall}
              onEnable={handleEnable}
              onDisable={handleDisable}
              onConfigure={handleConfigure}
            />
          ))}
          
          {filteredPlugins.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              No plugins found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PluginMarketPage; 