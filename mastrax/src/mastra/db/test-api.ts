import { initDatabase } from './index';
import { agentStorageTool } from '../tools';
import { logger } from '../logging';

/**
 * 测试API通过agent-storage工具访问数据库
 * 这模拟了前端如何通过API调用数据库
 */
async function testAgentStorageAPI() {
  console.log('========== 开始测试API访问数据库 ==========');
  
  try {
    // 1. 确保数据库已初始化
    console.log('1. 初始化数据库...');
    const initResult = await initDatabase();
    console.log(`   初始化结果: ${initResult ? '成功' : '失败'}`);
    
    if (!initResult) {
      console.error('数据库初始化失败，无法继续测试');
      return;
    }
    
    // 2. 测试创建智能体
    console.log('\n2. 测试通过API创建智能体...');
    const testAgentId = `test-agent-${Date.now()}`;
    
    try {
      // 模拟前端发送的请求
      const createResult = await agentStorageTool.execute({
        data: {
          operation: 'create',
          agent: {
            id: testAgentId,
            name: '测试智能体',
            description: '这是一个API测试智能体'
          }
        }
      });
      
      console.log(`   创建结果:`, createResult.success ? '成功' : '失败');
      if (!createResult.success) {
        console.error(`   错误信息: ${createResult.error}`);
      }
    } catch (error) {
      console.error('   创建智能体失败:', error);
    }
    
    // 3. 测试获取所有智能体
    console.log('\n3. 测试通过API获取所有智能体...');
    
    try {
      // 模拟前端发送的请求
      const getAllResult = await agentStorageTool.execute({
        data: {
          operation: 'getAll'
        }
      });
      
      console.log(`   获取结果:`, getAllResult.success ? '成功' : '失败');
      if (getAllResult.success) {
        const agents = getAllResult.data;
        console.log(`   获取到 ${agents.length} 个智能体`);
        
        // 打印第一个智能体的详细信息作为示例
        if (agents.length > 0) {
          console.log(`   示例智能体:`, agents[0]);
        }
      } else {
        console.error(`   错误信息: ${getAllResult.error}`);
      }
    } catch (error) {
      console.error('   获取智能体失败:', error);
    }
    
    // 4. 测试获取单个智能体
    console.log('\n4. 测试通过API获取单个智能体...');
    
    try {
      // 模拟前端发送的请求
      const getResult = await agentStorageTool.execute({
        data: {
          operation: 'get',
          agentId: testAgentId
        }
      });
      
      console.log(`   获取结果:`, getResult.success ? '成功' : '失败');
      if (!getResult.success) {
        console.error(`   错误信息: ${getResult.error}`);
      }
    } catch (error) {
      console.error('   获取智能体失败:', error);
    }
    
    // 5. 清理 - 删除测试智能体
    console.log('\n5. 清理 - 删除测试智能体...');
    
    try {
      // 模拟前端发送的请求
      const deleteResult = await agentStorageTool.execute({
        data: {
          operation: 'delete',
          agentId: testAgentId
        }
      });
      
      console.log(`   删除结果:`, deleteResult.success ? '成功' : '失败');
      if (!deleteResult.success) {
        console.error(`   错误信息: ${deleteResult.error}`);
      }
    } catch (error) {
      console.error('   删除智能体失败:', error);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
  
  console.log('========== API测试结束 ==========');
}

// 立即执行测试
testAgentStorageAPI().catch(console.error); 