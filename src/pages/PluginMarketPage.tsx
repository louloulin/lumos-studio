import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Avatar,
  Rating
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { pluginManager } from '../plugins/PluginManager';
import { Plugin, PluginStatus } from '../api/types/plugin';

// 模拟插件数据
const mockPlugins = [
  {
    id: 'file-system-plugin',
    name: '文件系统插件',
    description: '提供文件读写和管理功能',
    version: '1.0.0',
    author: 'Lumos团队',
    rating: 4.5,
    downloads: 1250,
    status: PluginStatus.Installed,
    isInstalled: true,
    category: '核心插件',
    icon: '📁',
    createdAt: new Date('2023-06-15').toISOString(),
    updatedAt: new Date('2023-07-20').toISOString()
  },
  {
    id: 'network-plugin',
    name: '网络请求插件',
    description: '提供HTTP请求和WebSocket连接功能',
    version: '1.0.0',
    author: 'Lumos团队',
    rating: 4.8,
    downloads: 980,
    status: PluginStatus.Active,
    isInstalled: true,
    category: '核心插件',
    icon: '🌐',
    createdAt: new Date('2023-06-15').toISOString(),
    updatedAt: new Date('2023-07-10').toISOString()
  },
  {
    id: 'database-plugin',
    name: '数据库插件',
    description: '提供数据存储和查询功能',
    version: '1.0.0',
    author: 'Lumos团队',
    rating: 4.6,
    downloads: 850,
    status: PluginStatus.Inactive,
    isInstalled: true,
    category: '核心插件',
    icon: '💾',
    createdAt: new Date('2023-06-20').toISOString(),
    updatedAt: new Date('2023-07-15').toISOString()
  },
  {
    id: 'tool-plugin',
    name: '工具插件',
    description: '提供各种实用工具，扩展智能体能力',
    version: '1.0.0',
    author: 'Lumos团队',
    rating: 4.7,
    downloads: 1100,
    status: PluginStatus.Installed,
    isInstalled: true,
    category: '核心插件',
    icon: '🔧',
    createdAt: new Date('2023-06-25').toISOString(),
    updatedAt: new Date('2023-07-25').toISOString()
  },
  {
    id: 'code-interpreter-plugin',
    name: '代码解释器插件',
    description: '允许执行Python、JavaScript等代码',
    version: '0.9.0',
    author: '开源社区',
    rating: 4.2,
    downloads: 720,
    status: PluginStatus.NotInstalled,
    isInstalled: false,
    category: '开发工具',
    icon: '💻',
    createdAt: new Date('2023-07-05').toISOString(),
    updatedAt: new Date('2023-07-30').toISOString()
  },
  {
    id: 'image-generation-plugin',
    name: '图像生成插件',
    description: '根据文本描述生成图像',
    version: '0.8.5',
    author: 'AI创新实验室',
    rating: 4.9,
    downloads: 1500,
    status: PluginStatus.NotInstalled,
    isInstalled: false,
    category: '创意工具',
    icon: '🎨',
    createdAt: new Date('2023-07-10').toISOString(),
    updatedAt: new Date('2023-08-05').toISOString()
  },
  {
    id: 'pdf-extractor-plugin',
    name: 'PDF提取插件',
    description: '从PDF文件中提取文本和结构化数据',
    version: '1.2.0',
    author: '文档处理团队',
    rating: 4.3,
    downloads: 950,
    status: PluginStatus.NotInstalled,
    isInstalled: false,
    category: '文档处理',
    icon: '📄',
    createdAt: new Date('2023-06-30').toISOString(),
    updatedAt: new Date('2023-08-01').toISOString()
  },
  {
    id: 'translation-plugin',
    name: '多语言翻译插件',
    description: '支持超过50种语言的实时翻译',
    version: '2.0.1',
    author: '语言学习中心',
    rating: 4.6,
    downloads: 1350,
    status: PluginStatus.NotInstalled,
    isInstalled: false,
    category: '语言工具',
    icon: '🌍',
    createdAt: new Date('2023-07-15').toISOString(),
    updatedAt: new Date('2023-08-10').toISOString()
  }
];

// 插件详情组件
const PluginDetail: React.FC<{ plugin: any, onClose: () => void, onInstall: () => void, onUninstall: () => void, onEnable: () => void, onDisable: () => void }> = ({ 
  plugin, 
  onClose, 
  onInstall, 
  onUninstall, 
  onEnable, 
  onDisable 
}) => {
  const theme = useTheme();
  
  const getActionButton = () => {
    if (!plugin.isInstalled) {
      return (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<CloudDownloadIcon />}
          onClick={onInstall}
        >
          安装
        </Button>
      );
    } else if (plugin.status === PluginStatus.Active) {
      return (
        <Button 
          variant="outlined" 
          color="warning" 
          startIcon={<ClearIcon />}
          onClick={onDisable}
        >
          禁用
        </Button>
      );
    } else {
      return (
        <Button 
          variant="outlined" 
          color="success" 
          startIcon={<CheckIcon />}
          onClick={onEnable}
        >
          启用
        </Button>
      );
    }
  };
  
  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Typography variant="h6" component="span" sx={{ mr: 1 }}>
            {plugin.icon} {plugin.name} 
          </Typography>
          <Chip 
            label={plugin.version} 
            size="small" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
          {plugin.isInstalled && (
            <Chip 
              label={plugin.status === PluginStatus.Active ? "已启用" : "已禁用"} 
              color={plugin.status === PluginStatus.Active ? "success" : "default"}
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body1" gutterBottom>
              {plugin.description}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                作者
              </Typography>
              <Typography variant="body2">
                {plugin.author}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                分类
              </Typography>
              <Typography variant="body2">
                {plugin.category}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                评分
              </Typography>
              <Box display="flex" alignItems="center">
                <Rating value={plugin.rating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  ({plugin.rating})
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                下载次数
              </Typography>
              <Typography variant="body2">
                {plugin.downloads}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                创建日期
              </Typography>
              <Typography variant="body2">
                {new Date(plugin.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                更新日期
              </Typography>
              <Typography variant="body2">
                {new Date(plugin.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              插件功能
            </Typography>
            <Typography variant="body2">
              本插件提供以下功能：
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="集成到智能体工具中" 
                  secondary="允许智能体直接调用此插件提供的功能"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="扩展系统能力" 
                  secondary="为应用程序增加新的功能和能力"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="用户界面集成" 
                  secondary="可选择性地提供用户界面元素"
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {plugin.isInstalled && (
          <Button 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={onUninstall}
          >
            卸载
          </Button>
        )}
        <Button onClick={onClose} color="inherit">
          关闭
        </Button>
        {getActionButton()}
      </DialogActions>
    </Dialog>
  );
};

// 插件卡片组件
const PluginCard: React.FC<{ plugin: any, onClick: () => void }> = ({ plugin, onClick }) => {
  return (
    <Card 
      elevation={3}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        },
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.light', fontFamily: '"Segoe UI Emoji"' }}>
            {plugin.icon}
          </Avatar>
        }
        title={plugin.name}
        subheader={`v${plugin.version} · ${plugin.author}`}
        action={
          plugin.isInstalled && (
            <Chip 
              label={plugin.status === PluginStatus.Active ? "已启用" : "已禁用"} 
              color={plugin.status === PluginStatus.Active ? "success" : "default"}
              size="small"
            />
          )
        }
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {plugin.description}
        </Typography>
        <Box 
          display="flex" 
          justifyContent="space-between"
          alignItems="center" 
          mt={2}
        >
          <Box display="flex" alignItems="center">
            <Rating value={plugin.rating} precision={0.1} readOnly size="small" />
            <Typography variant="body2" sx={{ ml: 0.5 }}>
              ({plugin.rating})
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {plugin.downloads} 下载
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// 插件市场页面
const PluginMarketPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<any | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  
  useEffect(() => {
    // 模拟从API加载插件
    setPlugins(mockPlugins);
  }, []);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };
  
  const handleCardClick = (plugin: any) => {
    setSelectedPlugin(plugin);
  };
  
  const handleDetailClose = () => {
    setSelectedPlugin(null);
  };
  
  const handleInstall = () => {
    if (selectedPlugin) {
      const updatedPlugins = plugins.map(p => 
        p.id === selectedPlugin.id 
          ? { ...p, isInstalled: true, status: PluginStatus.Installed } 
          : p
      );
      setPlugins(updatedPlugins);
      setSelectedPlugin({ ...selectedPlugin, isInstalled: true, status: PluginStatus.Installed });
      // 实际应用中应该调用插件管理器
      // pluginManager.installPlugin(selectedPlugin);
    }
  };
  
  const handleUninstall = () => {
    if (selectedPlugin) {
      setConfirmMessage(`确定要卸载插件 "${selectedPlugin.name}" 吗？`);
      setConfirmAction(() => () => {
        const updatedPlugins = plugins.map(p => 
          p.id === selectedPlugin.id 
            ? { ...p, isInstalled: false, status: PluginStatus.NotInstalled } 
            : p
        );
        setPlugins(updatedPlugins);
        setSelectedPlugin(null);
        // 实际应用中应该调用插件管理器
        // pluginManager.uninstallPlugin(selectedPlugin.id);
        setConfirmDialogOpen(false);
      });
      setConfirmDialogOpen(true);
    }
  };
  
  const handleEnable = () => {
    if (selectedPlugin) {
      const updatedPlugins = plugins.map(p => 
        p.id === selectedPlugin.id 
          ? { ...p, status: PluginStatus.Active } 
          : p
      );
      setPlugins(updatedPlugins);
      setSelectedPlugin({ ...selectedPlugin, status: PluginStatus.Active });
      // 实际应用中应该调用插件管理器
      // pluginManager.enablePlugin(selectedPlugin.id);
    }
  };
  
  const handleDisable = () => {
    if (selectedPlugin) {
      const updatedPlugins = plugins.map(p => 
        p.id === selectedPlugin.id 
          ? { ...p, status: PluginStatus.Inactive } 
          : p
      );
      setPlugins(updatedPlugins);
      setSelectedPlugin({ ...selectedPlugin, status: PluginStatus.Inactive });
      // 实际应用中应该调用插件管理器
      // pluginManager.disablePlugin(selectedPlugin.id);
    }
  };
  
  // 过滤和排序插件
  const filteredPlugins = plugins.filter(plugin => {
    // 根据标签过滤
    if (tabValue === 1 && !plugin.isInstalled) return false;
    if (tabValue === 2 && plugin.status !== PluginStatus.Active) return false;
    
    // 根据搜索词过滤
    if (searchQuery && !plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !plugin.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // 根据分类过滤
    if (selectedCategory && plugin.category !== selectedCategory) {
      return false;
    }
    
    return true;
  });
  
  // 获取所有分类
  const categories = Array.from(new Set(plugins.map(plugin => plugin.category)));
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          插件市场
        </Typography>
        <IconButton color="primary" aria-label="刷新插件列表">
          <RefreshIcon />
        </IconButton>
      </Box>
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant={isMobile ? "fullWidth" : "standard"}
        sx={{ mb: 3 }}
      >
        <Tab label="全部插件" />
        <Tab label="已安装" />
        <Tab label="已启用" />
      </Tabs>
      
      <Box sx={{ mb: 3, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="搜索插件..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
        />
        
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: isMobile ? 'flex-start' : 'flex-end',
          flex: isMobile ? '1' : '0 0 auto' 
        }}>
          <Chip 
            label="全部分类" 
            onClick={() => handleCategoryChange(null)}
            color={selectedCategory === null ? "primary" : "default"}
            variant={selectedCategory === null ? "filled" : "outlined"}
          />
          {categories.map(category => (
            <Chip 
              key={category}
              label={category}
              onClick={() => handleCategoryChange(category)}
              color={selectedCategory === category ? "primary" : "default"}
              variant={selectedCategory === category ? "filled" : "outlined"}
            />
          ))}
        </Box>
      </Box>
      
      {filteredPlugins.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            没有找到匹配的插件
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            尝试更改搜索词或过滤条件
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredPlugins.map(plugin => (
            <Grid item key={plugin.id} xs={12} sm={6} md={4}>
              <PluginCard 
                plugin={plugin} 
                onClick={() => handleCardClick(plugin)} 
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      {selectedPlugin && (
        <PluginDetail 
          plugin={selectedPlugin}
          onClose={handleDetailClose}
          onInstall={handleInstall}
          onUninstall={handleUninstall}
          onEnable={handleEnable}
          onDisable={handleDisable}
        />
      )}
      
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>确认操作</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
            取消
          </Button>
          <Button onClick={() => confirmAction()} color="error" autoFocus>
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PluginMarketPage; 