import { PluginDefinition, PluginContext, PluginPermission } from '../api/types/plugin';

/**
 * 工具插件
 * 提供各种实用工具，扩展智能体能力
 */
class ToolPlugin {
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  /**
   * 天气查询工具
   * @param location 位置
   * @returns 天气信息
   */
  async getWeather(location: string): Promise<any> {
    try {
      this.context.logger.info(`查询天气: ${location}`);
      // 模拟天气API调用
      return {
        location,
        temperature: Math.floor(Math.random() * 30) + 5,
        condition: ['晴朗', '多云', '阴天', '小雨', '大雨', '雷阵雨', '小雪', '大雪'][Math.floor(Math.random() * 8)],
        humidity: Math.floor(Math.random() * 50) + 30,
        windSpeed: Math.floor(Math.random() * 30),
        forecast: [
          { date: '今天', condition: '晴朗', highTemp: 28, lowTemp: 18 },
          { date: '明天', condition: '多云', highTemp: 27, lowTemp: 17 },
          { date: '后天', condition: '小雨', highTemp: 25, lowTemp: 16 }
        ]
      };
    } catch (error) {
      this.context.logger.error(`天气查询失败: ${error}`);
      throw new Error(`天气查询失败: ${error}`);
    }
  }

  /**
   * 汇率转换工具
   * @param amount 金额
   * @param from 原始货币
   * @param to 目标货币
   * @returns 转换结果
   */
  async convertCurrency(amount: number, from: string, to: string): Promise<any> {
    try {
      this.context.logger.info(`汇率转换: ${amount} ${from} 到 ${to}`);
      
      // 模拟汇率数据
      const rates: Record<string, Record<string, number>> = {
        'CNY': { 'USD': 0.14, 'EUR': 0.13, 'JPY': 20.71, 'GBP': 0.11 },
        'USD': { 'CNY': 7.14, 'EUR': 0.93, 'JPY': 148.70, 'GBP': 0.79 },
        'EUR': { 'CNY': 7.69, 'USD': 1.08, 'JPY': 160.10, 'GBP': 0.85 },
        'JPY': { 'CNY': 0.048, 'USD': 0.0067, 'EUR': 0.0062, 'GBP': 0.0053 },
        'GBP': { 'CNY': 9.05, 'USD': 1.27, 'EUR': 1.18, 'JPY': 188.36 }
      };
      
      // 如果是相同货币，直接返回
      if (from === to) {
        return {
          amount,
          from,
          to,
          result: amount,
          rate: 1
        };
      }
      
      // 检查货币是否支持
      if (!rates[from] || !rates[from][to]) {
        throw new Error(`不支持的货币转换: ${from} 到 ${to}`);
      }
      
      const rate = rates[from][to];
      const result = amount * rate;
      
      return {
        amount,
        from,
        to,
        result: Math.round(result * 100) / 100,
        rate
      };
    } catch (error) {
      this.context.logger.error(`汇率转换失败: ${error}`);
      throw new Error(`汇率转换失败: ${error}`);
    }
  }

  /**
   * 生成随机数
   * @param min 最小值
   * @param max 最大值
   * @returns 随机数
   */
  generateRandomNumber(min: number, max: number): number {
    this.context.logger.info(`生成随机数: ${min} 到 ${max}`);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 翻译文本
   * @param text 文本
   * @param from 源语言
   * @param to 目标语言
   * @returns 翻译结果
   */
  async translateText(text: string, from: string, to: string): Promise<any> {
    try {
      this.context.logger.info(`翻译文本: 从 ${from} 到 ${to}`);
      
      // 模拟翻译API调用
      // 实际应用中应该调用真实的翻译API
      const mockTranslations: Record<string, Record<string, (text: string) => string>> = {
        'zh': {
          'en': (text) => `[中译英] ${text}`,
          'ja': (text) => `[中译日] ${text}`,
          'fr': (text) => `[中译法] ${text}`
        },
        'en': {
          'zh': (text) => `[英译中] ${text}`,
          'ja': (text) => `[英译日] ${text}`,
          'fr': (text) => `[英译法] ${text}`
        }
      };
      
      // 检查语言是否支持
      if (!mockTranslations[from] || !mockTranslations[from][to]) {
        throw new Error(`不支持的翻译语言组合: ${from} 到 ${to}`);
      }
      
      // 执行模拟翻译
      const translatedText = mockTranslations[from][to](text);
      
      return {
        originalText: text,
        translatedText,
        from,
        to
      };
    } catch (error) {
      this.context.logger.error(`翻译失败: ${error}`);
      throw new Error(`翻译失败: ${error}`);
    }
  }

  /**
   * 计算器
   * @param expression 表达式
   * @returns 计算结果
   */
  calculate(expression: string): number {
    try {
      this.context.logger.info(`计算表达式: ${expression}`);
      
      // 安全起见，仅支持基本操作并移除所有非数学表达式
      const sanitizedExpression = expression.replace(/[^0-9+\-*/().]/g, '');
      
      // 使用eval计算，在实际应用中应该使用更安全的方法
      // eslint-disable-next-line no-eval
      return eval(sanitizedExpression);
    } catch (error) {
      this.context.logger.error(`计算失败: ${error}`);
      throw new Error(`计算失败: ${error}`);
    }
  }

  /**
   * 获取当前时间
   * @param timezone 时区
   * @returns 当前时间信息
   */
  getCurrentTime(timezone: string = 'Asia/Shanghai'): any {
    try {
      this.context.logger.info(`获取当前时间: ${timezone}`);
      
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      
      const formatter = new Intl.DateTimeFormat('zh-CN', options);
      const formattedDate = formatter.format(now);
      
      return {
        timezone,
        formattedDate,
        timestamp: now.getTime(),
        iso8601: now.toISOString()
      };
    } catch (error) {
      this.context.logger.error(`获取时间失败: ${error}`);
      throw new Error(`获取时间失败: ${error}`);
    }
  }
}

// 插件定义
const toolPluginDefinition: PluginDefinition = {
  manifest: {
    id: 'tool-plugin',
    name: '工具插件',
    description: '提供各种实用工具，扩展智能体能力',
    version: '1.0.0',
    author: 'Lumos团队',
    permissions: [PluginPermission.Network],
    main: 'index.js'
  },
  setup: async (context: PluginContext) => {
    const plugin = new ToolPlugin(context);
    
    // 注册天气工具
    context.api.registerTool({
      name: 'weather',
      description: '查询指定位置的天气信息',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: '位置，如城市名称'
          }
        },
        required: ['location']
      },
      execute: async ({ location }: { location: string }) => {
        return await plugin.getWeather(location);
      }
    });
    
    // 注册汇率转换工具
    context.api.registerTool({
      name: 'currency-converter',
      description: '货币汇率转换',
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: '金额'
          },
          from: {
            type: 'string',
            description: '原始货币代码，如 CNY, USD, EUR'
          },
          to: {
            type: 'string',
            description: '目标货币代码，如 CNY, USD, EUR'
          }
        },
        required: ['amount', 'from', 'to']
      },
      execute: async ({ amount, from, to }: { amount: number, from: string, to: string }) => {
        return await plugin.convertCurrency(amount, from, to);
      }
    });
    
    // 注册翻译工具
    context.api.registerTool({
      name: 'translator',
      description: '翻译文本',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: '要翻译的文本'
          },
          from: {
            type: 'string',
            description: '源语言代码，如 en, zh, ja, fr'
          },
          to: {
            type: 'string',
            description: '目标语言代码，如 en, zh, ja, fr'
          }
        },
        required: ['text', 'from', 'to']
      },
      execute: async ({ text, from, to }: { text: string, from: string, to: string }) => {
        return await plugin.translateText(text, from, to);
      }
    });
    
    // 注册随机数生成器
    context.api.registerTool({
      name: 'random-number',
      description: '生成指定范围内的随机数',
      parameters: {
        type: 'object',
        properties: {
          min: {
            type: 'number',
            description: '最小值'
          },
          max: {
            type: 'number',
            description: '最大值'
          }
        },
        required: ['min', 'max']
      },
      execute: ({ min, max }: { min: number, max: number }) => {
        return plugin.generateRandomNumber(min, max);
      }
    });
    
    // 注册计算器
    context.api.registerTool({
      name: 'calculator',
      description: '计算数学表达式',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: '数学表达式，如 1+2*3'
          }
        },
        required: ['expression']
      },
      execute: ({ expression }: { expression: string }) => {
        return plugin.calculate(expression);
      }
    });
    
    // 注册时间工具
    context.api.registerTool({
      name: 'current-time',
      description: '获取当前时间',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: '时区，如 Asia/Shanghai, America/New_York'
          }
        }
      },
      execute: ({ timezone }: { timezone?: string }) => {
        return plugin.getCurrentTime(timezone);
      }
    });
    
    context.logger.info('工具插件初始化完成');
  },
  
  onInstall: async () => {
    console.log('工具插件安装完成');
  },
  
  onUninstall: async () => {
    console.log('工具插件已卸载');
  },
  
  onEnable: async () => {
    console.log('工具插件已启用');
  },
  
  onDisable: async () => {
    console.log('工具插件已禁用');
  }
};

export default toolPluginDefinition; 