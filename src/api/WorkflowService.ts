import { MastraAPI } from './mastra';
import { toolService, Tool } from './ToolService';
import { v4 as uuidv4 } from 'uuid';

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
  LOOP = 'loop',
  FUNCTION = 'function',
  API = 'api',
  MESSAGE = 'message',
  AI = 'ai',
  VARIABLE = 'variable',
  KNOWLEDGE = 'knowledge',
  WEBHOOK = 'webhook'
}

// 触发器类型
export enum TriggerType {
  MANUAL = 'manual',         // 手动触发
  SCHEDULED = 'scheduled',   // 定时触发
  WEBHOOK = 'webhook',       // Webhook触发
  EVENT = 'event',           // 事件触发
  MESSAGE = 'message'        // 消息触发
}

// 变量类型
export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  ANY = 'any'
}

// 触发器定义
export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  name: string;
  description?: string;
  config: Record<string, any>;
}

// 变量定义
export interface WorkflowVariable {
  id: string;
  name: string;
  type: VariableType;
  description?: string;
  defaultValue?: any;
  required: boolean;
}

// 执行状态
export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED'
}

export type LogLevel = 'info' | 'warning' | 'error';

export interface ExecutionLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  nodeId?: string;
  nodeName?: string;
  data?: any;
}

export interface NodeExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

// 添加节点结果接口，避免类型错误
export interface NodeResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  startTime: number;
  endTime?: number;
  status: ExecutionStatus;
  variables: Record<string, any>;
  logs: ExecutionLog[];
  nodeResults: Record<string, NodeExecutionResult>;
  error?: string;
}

// 工作流节点定义
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType | string;
  name: string;
  description?: string;
  position?: { x: number, y: number };
  aiConfig?: {
    model: string;
    prompt: string;
    temperature: number;
    maxTokens: number;
    params?: Record<string, any>;
  };
  stringValue?: string;
  functionConfig?: {
    code: string;
    inputParams: { name: string; type: string }[];
    outputParams: { name: string; type: string }[];
    params?: Record<string, any>;
  };
  variableConfig?: {
    key: string;
    type: string;
    defaultValue: any;
  };
  triggerConfig?: {
    type: string;
    config: Record<string, any>;
  };
}

// 工作流连接定义
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
  mappings?: Record<string, string>; // 映射源节点输出到目标节点输入
}

// 工作流定义
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger?: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: WorkflowVariable[];
  createdAt: number;
  updatedAt: number;
  isPublic?: boolean;
  author?: string;
  tags?: string[];
  category?: string;
}

// 本地存储键
const LOCAL_WORKFLOWS_KEY = 'lumos_studio_workflows';
const LOCAL_EXECUTIONS_KEY = 'lumos_studio_workflow_executions';

export class WorkflowService {
  private workflows: Map<string, Workflow> = new Map();
  private executors: Map<string, any> = new Map(); // 工作流执行器缓存
  private executions: Map<string, ExecutionRecord> = new Map(); // 执行记录
  private executionRecords: Map<string, ExecutionRecord[]> = new Map();
  
  constructor() {
    this.loadWorkflows();
    this.loadExecutions();
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
   * 从本地存储加载执行记录
   */
  private loadExecutions(): void {
    try {
      const storedExecutions = localStorage.getItem(LOCAL_EXECUTIONS_KEY);
      if (storedExecutions) {
        const executions = JSON.parse(storedExecutions);
        executions.forEach((execution: ExecutionRecord) => {
          this.executions.set(execution.id, execution);
        });
      }
    } catch (error) {
      console.error('加载执行记录失败:', error);
      this.executions = new Map();
    }
  }
  
  /**
   * 保存执行记录到本地存储
   */
  private saveExecutions(): void {
    try {
      const executions = Array.from(this.executions.values());
      localStorage.setItem(LOCAL_EXECUTIONS_KEY, JSON.stringify(executions));
    } catch (error) {
      console.error('保存执行记录失败:', error);
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
  updateWorkflow(idOrWorkflow: string | Workflow, updates?: Partial<Workflow>): Workflow | null {
    let id: string;
    let workflowUpdates: Partial<Workflow>;
    
    if (typeof idOrWorkflow === 'string') {
      id = idOrWorkflow;
      workflowUpdates = updates || {};
    } else {
      // 如果第一个参数是Workflow对象，则直接使用它的id和整个对象作为更新
      id = idOrWorkflow.id;
      workflowUpdates = idOrWorkflow;
    }
    
    const workflow = this.getWorkflow(id);
    if (!workflow) {
      return null;
    }
    
    const now = Date.now();
    
    const updatedWorkflow: Workflow = {
      ...workflow,
      ...workflowUpdates,
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
   * @param workflow 工作流定义
   */
  generateWorkflowCode(workflow: Workflow): string {
    try {
      // 简单的工作流代码生成，后续可以扩展为更复杂的代码
      const code = `/**
 * 工作流: ${workflow.name}
 * 描述: ${workflow.description || '无描述'}
 * 创建时间: ${new Date(workflow.createdAt).toLocaleString()}
 * 更新时间: ${new Date(workflow.updatedAt).toLocaleString()}
 */

// 工作流定义
const workflow = {
  id: '${workflow.id}',
  name: '${workflow.name}',
  description: '${workflow.description || ''}',
  nodes: ${JSON.stringify(workflow.nodes, null, 2)},
  edges: ${JSON.stringify(workflow.edges, null, 2)}
};

// 工作流执行函数
async function executeWorkflow(inputs = {}) {
  console.log('开始执行工作流:', workflow.name);
  
  // 初始化节点状态
  const nodeStates = {};
  const nodeOutputs = {};
  
  // 获取开始节点
  const startNode = workflow.nodes.find(node => node.type === 'start');
  if (!startNode) {
    throw new Error('工作流缺少开始节点');
  }
  
  // 执行开始节点
  nodeOutputs[startNode.id] = inputs;
  
  // 工作流执行逻辑
  // ...此处根据具体实现添加节点执行逻辑...
  
  return nodeOutputs;
}

// 导出工作流
module.exports = {
  workflow,
  executeWorkflow
};`;
      
      return code;
    } catch (error) {
      console.error('生成工作流代码失败:', error);
      return `// 生成代码失败: ${error instanceof Error ? error.message : '未知错误'}`;
    }
  }
  
  /**
   * 执行工作流
   * @param id 工作流ID
   * @param inputs 输入参数
   */
  async executeWorkflow(id: string, inputs: Record<string, any> = {}): Promise<ExecutionRecord> {
    // 获取工作流
    const workflow = this.getWorkflow(id);
    if (!workflow) {
      throw new Error(`工作流不存在: ${id}`);
    }
    
    // 创建执行记录
    const executionId = uuidv4();
    const executionRecord: ExecutionRecord = {
      id: executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: ExecutionStatus.RUNNING,
      startTime: Date.now(),
      nodeResults: {},
      variables: { ...inputs },
      logs: []
    };
    
    // 保存初始执行记录
    this.executions.set(executionId, executionRecord);
    this.saveExecutions();
    
    try {
      // 执行工作流
      await this.runWorkflow(workflow, executionRecord);
      
      // 更新执行状态为完成
      executionRecord.status = ExecutionStatus.COMPLETED;
      executionRecord.endTime = Date.now();
    } catch (error) {
      // 更新执行状态为失败
      executionRecord.status = ExecutionStatus.FAILED;
      executionRecord.endTime = Date.now();
      executionRecord.error = error instanceof Error ? error.message : '未知错误';
      
      // 添加错误日志
      this.addExecutionLog(executionRecord, {
        id: uuidv4(),
        timestamp: Date.now(),
        nodeId: '',
        nodeName: '工作流执行器',
        message: `工作流执行失败: ${executionRecord.error}`,
        level: 'error'
      });
      
      console.error('工作流执行失败:', error);
    }
    
    // 保存最终执行记录
    this.executions.set(executionId, executionRecord);
    this.saveExecutions();
    
    return executionRecord;
  }
  
  /**
   * 运行工作流
   * @param workflow 工作流定义
   * @param executionRecord 执行记录
   */
  private async runWorkflow(workflow: Workflow, executionRecord: ExecutionRecord): Promise<void> {
    // 获取开始节点
    const startNode = workflow.nodes.find(node => node.type === WorkflowNodeType.START);
    if (!startNode) {
      throw new Error('工作流缺少开始节点');
    }
    
    // 添加开始执行日志
    this.addExecutionLog(executionRecord, {
      id: uuidv4(),
      timestamp: Date.now(),
      nodeId: startNode.id,
      nodeName: startNode.name,
      message: '开始执行工作流',
      level: 'info'
    });
    
    // 初始化已访问节点集合
    const visitedNodes = new Set<string>();
    
    // 从开始节点开始执行
    await this.executeNode(workflow, startNode.id, executionRecord, visitedNodes);
  }
  
  /**
   * 执行工作流节点
   * @param workflow 工作流定义
   * @param nodeId 当前节点ID
   * @param executionRecord 执行记录
   * @param visitedNodes 已访问节点集合
   */
  private async executeNode(
    workflow: Workflow, 
    nodeId: string, 
    executionRecord: ExecutionRecord,
    visitedNodes: Set<string>
  ): Promise<NodeResult> {
    // 如果节点已被访问，返回已有结果
    if (visitedNodes.has(nodeId) && executionRecord.nodeResults[nodeId]) {
      return executionRecord.nodeResults[nodeId];
    }
    
    // 标记节点已访问
    visitedNodes.add(nodeId);
    
    // 获取节点定义
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`找不到节点: ${nodeId}`);
    }
    
    // 添加节点开始执行日志
    this.addExecutionLog(executionRecord, {
      id: uuidv4(),
      timestamp: Date.now(),
      nodeId: node.id,
      nodeName: node.name,
      message: `开始执行节点: ${node.name}`,
      level: 'info'
    });
    
    try {
      let result: NodeResult;
      
      // 根据节点类型执行不同的操作
      switch (node.type) {
        case WorkflowNodeType.START:
          // 开始节点，直接返回成功
          result = { success: true, data: executionRecord.variables };
          break;
          
        case WorkflowNodeType.END:
          // 结束节点，直接返回成功
          result = { success: true, data: executionRecord.variables };
          break;
          
        case WorkflowNodeType.TOOL:
          // 工具节点，执行工具
          result = await this.executeToolNode(workflow, node, executionRecord);
          break;
          
        case WorkflowNodeType.CONDITION:
          // 条件节点，执行条件逻辑
          result = await this.executeConditionNode(workflow, node, executionRecord, visitedNodes);
          break;
          
        case WorkflowNodeType.AI:
          // AI节点，执行AI模型
          result = await this.executeAINode(workflow, node, executionRecord);
          break;
          
        case WorkflowNodeType.FUNCTION:
          // 函数节点，执行自定义函数
          result = await this.executeFunctionNode(workflow, node, executionRecord);
          break;
          
        default:
          // 不支持的节点类型
          throw new Error(`不支持的节点类型: ${node.type}`);
      }
      
      // 保存节点执行结果
      executionRecord.nodeResults[nodeId] = result;
      
      // 添加节点执行成功日志
      this.addExecutionLog(executionRecord, {
        id: uuidv4(),
        timestamp: Date.now(),
        nodeId: node.id,
        nodeName: node.name,
        message: `节点执行成功: ${node.name}`,
        level: 'info',
        data: result.data
      });
      
      // 如果不是结束节点，执行后续节点
      if (node.type !== WorkflowNodeType.END) {
        // 获取所有从当前节点出发的边
        const outgoingEdges = workflow.edges.filter(edge => edge.source === nodeId);
        
        // 如果是条件节点，已经在条件逻辑中处理了后续节点，这里不需要重复执行
        if (node.type !== WorkflowNodeType.CONDITION) {
          // 执行所有后续节点
          for (const edge of outgoingEdges) {
            // 检查条件
            if (edge.condition) {
              const conditionMet = this.evaluateCondition(edge.condition, result.data, executionRecord.variables);
              if (!conditionMet) {
                continue; // 条件不满足，跳过此边
              }
            }
            
            // 执行目标节点
            await this.executeNode(workflow, edge.target, executionRecord, visitedNodes);
          }
        }
      }
      
      return result;
    } catch (error) {
      // 添加节点执行失败日志
      this.addExecutionLog(executionRecord, {
        id: uuidv4(),
        timestamp: Date.now(),
        nodeId: node.id,
        nodeName: node.name,
        message: `节点执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        level: 'error'
      });
      
      // 保存节点执行结果
      const result: NodeResult = {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
      executionRecord.nodeResults[nodeId] = result;
      
      throw error;
    }
  }
  
  /**
   * 执行工具节点
   */
  private async executeToolNode(
    workflow: Workflow,
    node: WorkflowNode,
    executionRecord: ExecutionRecord
  ): Promise<NodeResult> {
    if (!node.aiConfig || !node.aiConfig.model) {
      throw new Error('工具节点缺少模型');
    }
    
    const model = node.aiConfig.model;
    const params = node.aiConfig.params || {};
    
    // 解析参数中的变量引用
    const resolvedParams = this.resolveVariables(params, executionRecord.variables);
    
    try {
      // 获取工具
      const tool = await toolService.getTool(model);
      if (!tool) {
        throw new Error(`找不到工具: ${model}`);
      }
      
      // 添加工具执行日志
      this.addExecutionLog(executionRecord, {
        id: uuidv4(),
        timestamp: Date.now(),
        nodeId: node.id,
        nodeName: node.name,
        message: `执行工具: ${model}`,
        level: 'info',
        data: resolvedParams
      });
      
      // 执行工具
      const result = await toolService.executeTool(model, { data: resolvedParams });
      
      return { success: true, data: result };
    } catch (error) {
      throw new Error(`工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 执行条件节点
   */
  private async executeConditionNode(
    workflow: Workflow,
    node: WorkflowNode,
    executionRecord: ExecutionRecord,
    visitedNodes: Set<string>
  ): Promise<NodeResult> {
    if (!node.functionConfig || !node.functionConfig.code) {
      throw new Error('条件节点缺少条件表达式');
    }
    
    const condition = node.functionConfig.code;
    
    // 评估条件
    const conditionResult = this.evaluateCondition(condition, null, executionRecord.variables);
    
    // 获取所有从当前节点出发的边
    const outgoingEdges = workflow.edges.filter(edge => edge.source === node.id);
    
    // 获取满足条件的边
    const matchingEdge = outgoingEdges.find(edge => {
      if (!edge.condition) {
        return false; // 没有条件的边不应该从条件节点出发
      }
      
      const edgeCondition = edge.condition === 'true' ? true : 
                           edge.condition === 'false' ? false : 
                           this.evaluateCondition(edge.condition, null, executionRecord.variables);
                           
      return edgeCondition === conditionResult;
    });
    
    // 如果没有找到匹配的边，查找默认边
    const defaultEdge = outgoingEdges.find(edge => !edge.condition || edge.condition === 'default');
    
    // 确定要执行的下一个节点
    const nextEdge = matchingEdge || defaultEdge;
    
    if (nextEdge) {
      // 执行下一个节点
      await this.executeNode(workflow, nextEdge.target, executionRecord, visitedNodes);
    }
    
    return { success: true, data: { result: conditionResult } };
  }
  
  /**
   * 执行AI节点
   */
  private async executeAINode(
    workflow: Workflow,
    node: WorkflowNode,
    executionRecord: ExecutionRecord
  ): Promise<NodeResult> {
    if (!node.aiConfig) {
      throw new Error('AI节点缺少AI配置');
    }
    
    const { model, prompt, temperature } = node.aiConfig;
    
    // 解析提示词中的变量
    const resolvedPrompt = this.resolveVariablesInString(prompt || '', executionRecord.variables);
    
    try {
      // 这里应该调用实际的AI服务API
      // 由于这是一个示例，我们创建一个模拟响应
      const mockResponse = `这是来自 ${model} 的响应。
系统提示: ${resolvedPrompt}
温度: ${temperature || 0.7}
      
这是一个模拟的AI响应，在实际实现中，这里应该是调用真实AI服务API获取的响应内容。`;
      
      // 添加AI执行日志
      this.addExecutionLog(executionRecord, {
        id: uuidv4(),
        timestamp: Date.now(),
        nodeId: node.id,
        nodeName: node.name,
        message: `执行AI模型: ${model}`,
        level: 'info',
        data: {
          prompt: resolvedPrompt,
          temperature
        }
      });
      
      return { success: true, data: { response: mockResponse } };
    } catch (error) {
      throw new Error(`AI执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 执行函数节点
   */
  private async executeFunctionNode(
    workflow: Workflow,
    node: WorkflowNode,
    executionRecord: ExecutionRecord
  ): Promise<NodeResult> {
    if (!node.functionConfig || !node.functionConfig.code) {
      throw new Error('函数节点缺少函数代码');
    }
    
    const functionCode = node.functionConfig.code;
    const functionParams = node.functionConfig.params || {};
    
    // 解析参数中的变量引用
    const resolvedParams = this.resolveVariables(functionParams, executionRecord.variables);
    
    try {
      // 添加函数执行日志
      this.addExecutionLog(executionRecord, {
        id: uuidv4(),
        timestamp: Date.now(),
        nodeId: node.id,
        nodeName: node.name,
        message: `执行函数`,
        level: 'info',
        data: resolvedParams
      });
      
      // 创建函数
      // 注意: 在实际环境中，应该使用更安全的函数执行方式，比如Web Worker或沙箱
      // eslint-disable-next-line no-new-func
      const fn = new Function('params', 'context', functionCode);
      
      // 执行函数
      const result = await fn(resolvedParams, {
        variables: executionRecord.variables,
        workflow,
        node
      });
      
      return { success: true, data: result };
    } catch (error) {
      throw new Error(`函数执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 评估条件表达式
   * @param condition 条件表达式
   * @param nodeData 节点数据
   * @param variables 工作流变量
   */
  private evaluateCondition(
    condition: string,
    nodeData: any,
    variables: Record<string, any>
  ): boolean {
    try {
      // 创建上下文
      const context = {
        data: nodeData,
        vars: variables,
        // 添加一些辅助函数
        isNull: (val: any) => val === null || val === undefined,
        isEmpty: (val: any) => {
          if (val === null || val === undefined) return true;
          if (typeof val === 'string') return val.trim() === '';
          if (Array.isArray(val)) return val.length === 0;
          if (typeof val === 'object') return Object.keys(val).length === 0;
          return false;
        },
        contains: (str: string, substr: string) => {
          if (typeof str !== 'string') return false;
          return str.includes(substr);
        }
      };
      
      // 使用 eval 评估条件 (在实际环境中应该使用更安全的方式)
      // eslint-disable-next-line no-new-func
      const evalFn = new Function('ctx', `with(ctx) { return (${condition}); }`);
      return !!evalFn(context);
    } catch (error) {
      console.error('条件评估失败:', error, condition);
      return false;
    }
  }
  
  /**
   * 解析对象中的变量引用
   * @param obj 包含变量引用的对象
   * @param variables 变量值
   */
  private resolveVariables(obj: any, variables: Record<string, any>): any {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
      return this.resolveVariablesInString(obj, variables);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveVariables(item, variables));
    }
    
    if (typeof obj === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.resolveVariables(value, variables);
      }
      return result;
    }
    
    return obj;
  }
  
  /**
   * 解析字符串中的变量引用
   * @param str 包含变量引用的字符串
   * @param variables 变量值
   */
  private resolveVariablesInString(str: string, variables: Record<string, any>): string {
    if (!str || typeof str !== 'string') return str;
    
    // 替换 {{variable}} 格式的变量引用
    return str.replace(/\{\{([^{}]+)\}\}/g, (match, variablePath) => {
      try {
        // 解析变量路径
        const path = variablePath.trim().split('.');
        let value = variables;
        
        for (const key of path) {
          if (value === undefined || value === null) return match;
          value = value[key];
        }
        
        if (value === undefined || value === null) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      } catch (error) {
        console.error('变量解析失败:', error, variablePath);
        return match;
      }
    });
  }
  
  /**
   * 添加执行日志
   */
  private addExecutionLog(executionRecord: ExecutionRecord, log: ExecutionLog): void {
    executionRecord.logs.push(log);
  }
  
  /**
   * 获取执行记录
   * @param executionId 执行ID
   */
  getExecutionRecord(executionId: string): ExecutionRecord | null {
    return this.executions.get(executionId) || null;
  }
  
  /**
   * 获取工作流的所有执行记录
   * @param workflowId 工作流ID
   */
  getWorkflowExecutions(workflowId: string): ExecutionRecord[] {
    // 尝试从本地存储加载
    try {
      const storedRecords = localStorage.getItem(`workflow_executions_${workflowId}`);
      if (storedRecords) {
        const records = JSON.parse(storedRecords) as ExecutionRecord[];
        this.executionRecords.set(workflowId, records);
        return records;
      }
    } catch (error) {
      console.error('Failed to load execution records:', error);
    }
    
    return this.executionRecords.get(workflowId) || [];
  }
  
  /**
   * 获取所有执行记录
   */
  getAllExecutions(): ExecutionRecord[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startTime - a.startTime); // 按开始时间降序排序
  }
  
  /**
   * 删除执行记录
   * @param executionId 执行ID
   */
  deleteExecution(executionId: string): void {
    // 遍历所有工作流的执行记录
    for (const [workflowId, records] of this.executionRecords.entries()) {
      const filteredRecords = records.filter(r => r.id !== executionId);
      
      if (filteredRecords.length !== records.length) {
        this.executionRecords.set(workflowId, filteredRecords);
        
        // 更新本地存储
        try {
          localStorage.setItem(`workflow_executions_${workflowId}`, 
            JSON.stringify(filteredRecords));
        } catch (error) {
          console.error('Failed to update execution records:', error);
        }
        
        break;
      }
    }
  }
  
  /**
   * 清除工作流的所有执行记录
   * @param workflowId 工作流ID
   */
  clearWorkflowExecutions(workflowId: string): void {
    this.executionRecords.set(workflowId, []);
    
    // 清除本地存储
    try {
      localStorage.removeItem(`workflow_executions_${workflowId}`);
    } catch (error) {
      console.error('Failed to clear execution records:', error);
    }
  }
  
  /**
   * 生成唯一ID
   */
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  }
}

// 创建单例实例供组件直接使用
export const workflowService = new WorkflowService(); 

/**
 * 创建一个新的工作流节点
 * @param type 节点类型
 * @param name 节点名称
 * @param position 节点位置
 * @returns 新创建的工作流节点
 */
export function createWorkflowNode(
  type: WorkflowNodeType | string, 
  name: string, 
  position: { x: number, y: number }
): WorkflowNode {
  return {
    id: `node_${Date.now()}`,
    type,
    name,
    description: '',
    position
  };
} 