import { MastraAPI } from './mastra';

/**
 * 工作流服务类
 * 用于创建、管理和执行工作流
 */

// 工作流节点类型
export enum WorkflowNodeType {
  START = 'start',
  END = 'end',
  AGENT = 'agent',
  CONDITION = 'condition',
  TOOL = 'tool',
  INPUT = 'input',
  OUTPUT = 'output',
  LOOP = 'loop'
}

// 工作流节点定义
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  description?: string;
  config?: Record<string, any>;
  x: number;
  y: number;
}

// 工作流连接定义
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

// 工作流定义
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: number;
  updatedAt: number;
  isPublic?: boolean;
  author?: string;
}

// 本地存储键
const LOCAL_WORKFLOWS_KEY = 'lumos_studio_workflows';

export class WorkflowService {
  private workflows: Map<string, Workflow> = new Map();
  private executors: Map<string, any> = new Map(); // 工作流执行器缓存
  
  constructor() {
    this.loadWorkflows();
  }
  
  /**
   * 从本地存储加载工作流
   */
  private loadWorkflows(): void {
    try {
      const storedWorkflows = localStorage.getItem(LOCAL_WORKFLOWS_KEY);
      if (storedWorkflows) {
        const workflows = JSON.parse(storedWorkflows);
        workflows.forEach((workflow: Workflow) => {
          this.workflows.set(workflow.id, workflow);
        });
      }
    } catch (error) {
      console.error('加载工作流失败:', error);
      this.workflows = new Map();
    }
  }
  
  /**
   * 保存工作流到本地存储
   */
  private saveWorkflows(): void {
    try {
      const workflows = Array.from(this.workflows.values());
      localStorage.setItem(LOCAL_WORKFLOWS_KEY, JSON.stringify(workflows));
    } catch (error) {
      console.error('保存工作流失败:', error);
    }
  }
  
  /**
   * 获取所有工作流
   */
  getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }
  
  /**
   * 根据ID获取工作流
   */
  getWorkflow(id: string): Workflow | null {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      console.error(`工作流不存在: ${id}`);
      return null;
    }
    return workflow;
  }
  
  /**
   * 创建新工作流
   */
  createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Workflow {
    const now = Date.now();
    const newWorkflow: Workflow = {
      ...workflow,
      id: this.generateUniqueId(),
      createdAt: now,
      updatedAt: now
    };
    
    this.workflows.set(newWorkflow.id, newWorkflow);
    this.saveWorkflows();
    return newWorkflow;
  }
  
  /**
   * 更新工作流
   */
  updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | null {
    const workflow = this.getWorkflow(id);
    if (!workflow) {
      return null;
    }
    
    const now = Date.now();
    
    const updatedWorkflow: Workflow = {
      ...workflow,
      ...updates,
      updatedAt: now
    };
    
    this.workflows.set(updatedWorkflow.id, updatedWorkflow);
    this.saveWorkflows();
    return updatedWorkflow;
  }
  
  /**
   * 删除工作流
   */
  deleteWorkflow(id: string): boolean {
    const initialLength = this.workflows.size;
    this.workflows.delete(id);
    
    if (this.workflows.size !== initialLength) {
      this.saveWorkflows();
      return true;
    }
    
    return false;
  }
  
  /**
   * 导出工作流为JSON
   */
  exportWorkflow(id: string): string | null {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      return null;
    }
    
    return JSON.stringify(workflow, null, 2);
  }
  
  /**
   * 导入工作流从JSON
   */
  importWorkflow(jsonString: string): Workflow | null {
    try {
      const workflow = JSON.parse(jsonString) as Workflow;
      if (!workflow.id || !workflow.name || !workflow.nodes || !workflow.edges) {
        throw new Error('无效的工作流格式');
      }
      
      // 确保ID唯一
      workflow.id = this.generateUniqueId();
      const now = Date.now();
      workflow.createdAt = now;
      workflow.updatedAt = now;
      
      this.workflows.set(workflow.id, workflow);
      this.saveWorkflows();
      return workflow;
    } catch (error) {
      console.error('导入工作流失败:', error);
      return null;
    }
  }
  
  /**
   * 生成工作流代码
   */
  generateWorkflowCode(workflow: Workflow): string {
    // 创建可运行的工作流代码
    let code = `
import { Step, Workflow } from '@mastra/core/workflows';

// ${workflow.name} 工作流
// ${workflow.description || ''}
const ${workflow.name.replace(/\s+/g, '')} = new Workflow({
  name: '${workflow.name.replace(/\s+/g, '-').toLowerCase()}',
  description: '${workflow.description || workflow.name}'
});

// 定义步骤
`;

    // 添加节点定义
    workflow.nodes.forEach(node => {
      switch (node.type) {
        case WorkflowNodeType.AGENT:
          code += `
// ${node.label} - 智能体步骤
const step${node.id} = new Step({
  name: '${node.label}',
  execute: async (context) => {
    // 获取输入
    const input = context.getInput();
    
    // 调用智能体
    const agent = context.agents.${node.config?.agentId || 'agent'};
    const result = await agent.generate({
      messages: [
        { role: 'system', content: '${node.config?.instructions || '你是一个有用的助手'}' },
        { role: 'user', content: input }
      ]
    });
    
    // 返回结果
    return result.text;
  }
});
`;
          break;
          
        case WorkflowNodeType.TOOL:
          code += `
// ${node.label} - 工具步骤
const step${node.id} = new Step({
  name: '${node.label}',
  execute: async (context) => {
    // 获取输入
    const input = context.getInput();
    
    // 执行工具操作
    ${node.config?.toolCode || '// 在这里添加工具调用代码'}
    
    // 返回结果
    return result;
  }
});
`;
          break;
          
        case WorkflowNodeType.CONDITION:
          code += `
// ${node.label} - 条件步骤
const step${node.id} = new Step({
  name: '${node.label}',
  execute: async (context) => {
    // 获取输入
    const input = context.getInput();
    
    // 评估条件
    ${node.config?.conditionCode || '// 在这里添加条件评估代码'}
    
    // 返回结果
    return result;
  }
});
`;
          break;
          
        default:
          if (node.type !== WorkflowNodeType.START && node.type !== WorkflowNodeType.END) {
            code += `
// ${node.label} - ${node.type} 步骤
const step${node.id} = new Step({
  name: '${node.label}',
  execute: async (context) => {
    // 获取输入
    const input = context.getInput();
    
    // 处理逻辑
    ${node.config?.code || '// 在这里添加处理代码'}
    
    // 返回结果
    return input;
  }
});
`;
          }
      }
    });
    
    // 添加步骤到工作流
    code += `
// 添加步骤到工作流
`;
    workflow.nodes.forEach(node => {
      if (node.type !== WorkflowNodeType.START && node.type !== WorkflowNodeType.END) {
        code += `${workflow.name.replace(/\s+/g, '')}.addStep(step${node.id});\n`;
      }
    });
    
    // 添加连接
    code += `
// 添加连接
`;
    workflow.edges.forEach(edge => {
      code += `${workflow.name.replace(/\s+/g, '')}.addEdge({
  from: 'step${edge.source}',
  to: 'step${edge.target}'${edge.condition ? `,
  condition: (result) => ${edge.condition}` : ''}
});\n`;
    });
    
    // 完成工作流
    code += `
// 提交工作流
${workflow.name.replace(/\s+/g, '')}.commit();

export { ${workflow.name.replace(/\s+/g, '')} };
`;
    
    return code;
  }
  
  /**
   * 执行工作流
   */
  async executeWorkflow(id: string, input: any = {}): Promise<any> {
    try {
      const workflow = this.getWorkflow(id);
      if (!workflow) {
        throw new Error(`找不到工作流: ${id}`);
      }
      
      // 动态导入工作流执行器以避免循环依赖
      const { WorkflowExecutor } = await import('./WorkflowExecutor');
      
      // 创建执行器
      const executor = new WorkflowExecutor(workflow, {
        onNodeComplete: (result) => {
          console.log(`节点执行完成: ${result.nodeId}`, result);
        },
        onWorkflowComplete: (state) => {
          console.log('工作流执行完成', state);
        },
        onWorkflowError: (error, state) => {
          console.error('工作流执行失败', error, state);
        }
      });
      
      // 缓存执行器
      this.executors.set(id, executor);
      
      // 执行工作流并返回结果
      const result = await executor.execute({ initial: input });
      return result.outputs.final;
    } catch (error) {
      console.error(`执行工作流失败: ${id}`, error);
      throw new Error(`执行工作流失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取工作流执行器
   */
  getWorkflowExecutor(id: string): any {
    return this.executors.get(id) || null;
  }
  
  /**
   * 清理工作流执行器缓存
   */
  clearExecutor(id: string): void {
    if (this.executors.has(id)) {
      this.executors.delete(id);
    }
  }
  
  /**
   * 生成唯一ID
   */
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  }
}

// 导出单例实例
export const workflowService = new WorkflowService(); 