// 示例：如何正确调用Mastrax工具API
import { Mastra } from '@mastra/client-js';

// 初始化Mastra客户端
const mastra = new Mastra({
  baseUrl: 'http://localhost:3000', // 指向你的Mastrax服务
});

// ========================
// 使用带data包装的API请求
// ========================

// 示例1：创建一个新智能体（带data包装）
async function createAgentWithData() {
  try {
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'create',
        agent: {
          name: '测试智能体',         // 必填
          description: '这是一个测试智能体',  // 可选
          instructions: '你是一个有用的助手', // 可选
          model: 'gpt-4-turbo',      // 可选
          temperature: 0.7,          // 可选，范围0-1
          maxTokens: 2048,           // 可选，正整数
          tools: ['weather'],        // 可选，工具ID数组
          systemAgent: false,        // 可选，是否系统智能体
          type: 'general',           // 可选，智能体类型
          categories: ['测试', '演示'], // 可选，分类标签
          version: '1.0.0',          // 可选，版本号
          avatar: '/avatars/default.png' // 可选，头像路径
        }
      }
    });
    
    console.log('创建智能体成功:', response);
    return response.data.id; // 返回新创建的智能体ID
  } catch (error) {
    console.error('创建智能体失败:', error);
    throw error;
  }
}

// ========================
// 使用直接API请求（无data包装）
// ========================

// 示例1B：创建一个新智能体（无data包装）
async function createAgentDirect() {
  try {
    const response = await mastra.runTool('agent-storage', {
      operation: 'create',
      agent: {
        name: '编程助手',          
        description: '专注于代码开发的智能体，可以帮助编写、解释和调试代码。',
        instructions: '你是一个专业的编程助手，擅长编写、解释和调试代码。你应该提供清晰、易于理解的代码示例，并解释代码的工作原理。优先考虑代码的可读性、效率和最佳实践。',
        model: 'gpt-4-turbo',
        type: 'coding',              // 智能体类型
        categories: ['编程', '开发', '调试'], // 分类标签
        version: '1.0.0',            // 版本号
        createdAt: Date.now(),       // 创建时间戳
        updatedAt: Date.now(),       // 更新时间戳
        avatar: '/templates/coding.png' // 头像路径
      }
    });
    
    console.log('直接创建智能体成功:', response);
    return response.data.id;
  } catch (error) {
    console.error('直接创建智能体失败:', error);
    throw error;
  }
}

// 示例2：获取一个智能体
async function getAgent(agentId) {
  try {
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'get',
        agentId: agentId  // 必填，智能体ID
      }
    });
    
    console.log('获取智能体成功:', response);
    return response.data;
  } catch (error) {
    console.error('获取智能体失败:', error);
    throw error;
  }
}

// 示例2B：获取一个智能体（无data包装）
async function getAgentDirect(agentId) {
  try {
    const response = await mastra.runTool('agent-storage', {
      operation: 'get',
      agentId: agentId  // 必填，智能体ID
    });
    
    console.log('直接获取智能体成功:', response);
    return response.data;
  } catch (error) {
    console.error('直接获取智能体失败:', error);
    throw error;
  }
}

// 示例3：更新一个智能体
async function updateAgent(agentId) {
  try {
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'update',
        agent: {
          id: agentId,                   // 必填
          name: '更新后的智能体名称',      // 至少更新一个属性
          description: '这是更新后的描述',
          temperature: 0.8               // 可以更新任何可选属性
        }
      }
    });
    
    console.log('更新智能体成功:', response);
    return response.data;
  } catch (error) {
    console.error('更新智能体失败:', error);
    throw error;
  }
}

// 示例3B：更新一个智能体的类型和分类（无data包装）
async function updateAgentCategoryDirect(agentId) {
  try {
    const response = await mastra.runTool('agent-storage', {
      operation: 'update',
      agent: {
        id: agentId,                     // 必填
        type: 'creative',                // 更新智能体类型
        categories: ['创意', '设计', '艺术'], // 更新分类标签
        updatedAt: Date.now()            // 更新时间戳
      }
    });
    
    console.log('直接更新智能体类型成功:', response);
    return response.data;
  } catch (error) {
    console.error('直接更新智能体类型失败:', error);
    throw error;
  }
}

// 示例4：获取所有智能体
async function getAllAgents() {
  try {
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'getAll'
        // 不需要其他参数
      }
    });
    
    console.log('获取所有智能体成功:', response);
    return response.data;
  } catch (error) {
    console.error('获取所有智能体失败:', error);
    throw error;
  }
}

// 示例4B：获取所有智能体（无data包装）
async function getAllAgentsDirect() {
  try {
    const response = await mastra.runTool('agent-storage', {
      operation: 'getAll'
      // 不需要其他参数
    });
    
    console.log('直接获取所有智能体成功:', response);
    return response.data;
  } catch (error) {
    console.error('直接获取所有智能体失败:', error);
    throw error;
  }
}

// 示例5：删除一个智能体
async function deleteAgent(agentId) {
  try {
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'delete',
        agentId: agentId  // 必填，智能体ID
      }
    });
    
    console.log('删除智能体成功:', response);
    return response.data;
  } catch (error) {
    console.error('删除智能体失败:', error);
    throw error;
  }
}

// 示例5B：删除一个智能体（无data包装）
async function deleteAgentDirect(agentId) {
  try {
    const response = await mastra.runTool('agent-storage', {
      operation: 'delete',
      agentId: agentId  // 必填，智能体ID
    });
    
    console.log('直接删除智能体成功:', response);
    return response.data;
  } catch (error) {
    console.error('直接删除智能体失败:', error);
    throw error;
  }
}

// 示例6：使用调试工具获取系统信息
async function getSystemInfo() {
  try {
    const response = await mastra.runTool('debug-tool', {
      data: {
        action: 'info'
      }
    });
    
    console.log('系统信息:', response);
    return response.data;
  } catch (error) {
    console.error('获取系统信息失败:', error);
    throw error;
  }
}

// 示例7：使用调试工具检查API格式
async function inspectApiFormat() {
  try {
    const response = await mastra.runTool('debug-tool', {
      data: {
        action: 'inspect-api-format'
      }
    });
    
    console.log('API格式检查结果:', response);
    return response.data;
  } catch (error) {
    console.error('API格式检查失败:', error);
    throw error;
  }
}

// 示例8：使用调试工具检查请求
async function inspectRequest() {
  try {
    const response = await mastra.runTool('debug-tool', {
      data: {
        action: 'inspect-request',
        params: {
          customParam: '这是自定义参数',
          timestamp: Date.now()
        }
      }
    });
    
    console.log('请求检查结果:', response);
    return response.data;
  } catch (error) {
    console.error('请求检查失败:', error);
    throw error;
  }
}

// 常见错误演示：没有提供data对象
async function wrongWayToCallApi() {
  try {
    // 错误示例 - 不要这样做！
    const response = await mastra.runTool('agent-storage', {
      operation: 'getAll' // 缺少data包装
    });
    
    console.log('这行代码不会执行，因为会抛出错误');
  } catch (error) {
    console.error('错误调用API:', error);
    // 正确的修复方法是添加data对象
    const fixedResponse = await mastra.runTool('agent-storage', {
      data: {
        operation: 'getAll'
      }
    });
    console.log('修复后的调用:', fixedResponse);
  }
}

// 错误演示：类型验证失败
async function wrongTypeDemo() {
  try {
    // 错误示例 - temperature不在0-1范围内
    const response = await mastra.runTool('agent-storage', {
      data: {
        operation: 'create',
        agent: {
          name: '测试智能体',
          temperature: 2.5 // 错误：温度必须在0-1之间
        }
      }
    });
  } catch (error) {
    console.error('类型验证失败:', error);
    
    // 正确的温度值
    const fixedResponse = await mastra.runTool('agent-storage', {
      data: {
        operation: 'create',
        agent: {
          name: '测试智能体',
          temperature: 0.7 // 正确：在0-1之间
        }
      }
    });
    console.log('修复后的调用:', fixedResponse);
  }
}

// 完整演示流程
async function runDemo() {
  console.log('=== Mastrax API 使用示例 ===');
  
  // 1. 获取系统信息
  await getSystemInfo();
  
  // 2. 创建智能体（两种方式）
  const agentId1 = await createAgentWithData();
  const agentId2 = await createAgentDirect();
  
  // 3. 获取智能体（两种方式）
  await getAgent(agentId1);
  await getAgentDirect(agentId2);
  
  // 4. 更新智能体（两种方式）
  await updateAgent(agentId1);
  await updateAgentCategoryDirect(agentId2);
  
  // 5. 获取所有智能体（两种方式）
  await getAllAgents();
  await getAllAgentsDirect();
  
  // 6. 删除智能体（两种方式）
  await deleteAgent(agentId1);
  await deleteAgentDirect(agentId2);
  
  // 7. 运行API格式检查
  await inspectApiFormat();
  
  // 8. 检查请求
  await inspectRequest();
  
  // 9. 演示常见错误
  await wrongWayToCallApi();
  
  // 10. 演示类型验证错误
  await wrongTypeDemo();
  
  console.log('=== 演示完成 ===');
}

// 执行演示
runDemo().catch(console.error);

// 导出函数以便单独测试
export {
  createAgentWithData,
  createAgentDirect,
  getAgent,
  getAgentDirect,
  updateAgent,
  updateAgentCategoryDirect,
  getAllAgents,
  getAllAgentsDirect,
  deleteAgent,
  deleteAgentDirect,
  getSystemInfo,
  inspectApiFormat,
  inspectRequest,
  wrongWayToCallApi,
  wrongTypeDemo
};