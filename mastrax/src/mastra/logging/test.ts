import { logger } from './index';

async function testLogging() {
  try {
    // 测试基本日志级别
    logger.debug('这是一条调试日志');
    logger.info('这是一条信息日志');
    logger.warn('这是一条警告日志');
    logger.error('这是一条错误日志');
    
    // 测试带有元数据的日志
    logger.info('带有元数据的日志', { 
      userId: '12345', 
      action: 'login',
      timestamp: new Date().toISOString()
    });
    
    // 测试对象格式日志
    logger.info({
      message: '这是一条结构化日志消息',
      destinationPath: 'auth',
      type: 'SYSTEM',
      userId: '12345',
      action: 'signup',
      timestamp: new Date().toISOString()
    });
    
    // 测试智能体日志
    const testAgentId = 'test-agent-123';
    logger.agent.info(testAgentId, '智能体已启动', {
      model: 'gpt-4',
      temperature: 0.7,
      metadata: { purpose: '天气查询' }
    });
    
    logger.agent.error(testAgentId, '智能体出错', {
      error: 'API超时',
      retryCount: 3
    });
    
    // 测试工作流日志
    const testWorkflowId = 'workflow-456';
    logger.workflow.info(testWorkflowId, '工作流已启动', {
      steps: ['初始化', '数据获取', '处理', '结果输出'],
      priority: 'high'
    });
    
    logger.workflow.debug(testWorkflowId, '工作流调试信息', {
      currentStep: '数据获取',
      progress: '25%'
    });
    
    console.log('日志测试完成！请查看日志文件或控制台输出。');
  } catch (error) {
    console.error('日志测试失败:', error);
  }
}

testLogging(); 