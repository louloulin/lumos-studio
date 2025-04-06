import { WorkflowService, Workflow, WorkflowNode, WorkflowEdge, WorkflowNodeType } from './WorkflowService';
import { agentService } from './AgentService';
import { toolService } from './ToolService';
import { MastraAPI } from './mastra';
import { Agent } from './types'; // Import Agent type from types file

// 工作流执行状态
export enum WorkflowExecutionStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 节点执行状态
export enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

// 节点执行结果
export interface NodeExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
  output?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

// 工作流执行状态
export interface WorkflowExecutionState {
  workflowId: string;
  status: WorkflowExecutionStatus;
  currentNodeId: string | null;
  nodeResults: Record<string, NodeExecutionResult>;
  outputs: Record<string, any>;
  inputs: Record<string, any>;
  context: Record<string, any>;
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: string;
}

// 工作流执行事件回调
export interface WorkflowExecutorCallbacks {
  onNodeStart?: (nodeId: string, context: Record<string, any>) => void;
  onNodeComplete?: (result: NodeExecutionResult, context: Record<string, any>) => void;
  onWorkflowComplete?: (state: WorkflowExecutionState) => void;
  onWorkflowError?: (error: Error, state: WorkflowExecutionState) => void;
  onStatusChange?: (status: WorkflowExecutionStatus, state: WorkflowExecutionState) => void;
}

/**
 * 工作流执行引擎
 * 负责解析和执行工作流，管理节点的执行状态和结果
 */
export class WorkflowExecutor {
  private workflow: Workflow;
  private state: WorkflowExecutionState;
  private callbacks: WorkflowExecutorCallbacks;
  private mastraAPI: typeof MastraAPI; // Fix the type reference
  private executionPromise: Promise<WorkflowExecutionState> | null = null;
  private shouldPause: boolean = false;
  private shouldStop: boolean = false;
  private nodeExecutionCount: Record<string, number> = {}; // 节点执行次数计数器
  private maxNodeExecutions: number = 100; // 单个节点最大执行次数，防止无限循环

  constructor(workflow: Workflow, callbacks: WorkflowExecutorCallbacks = {}) {
    this.workflow = workflow;
    this.callbacks = callbacks;
    this.mastraAPI = MastraAPI; // Use the MastraAPI directly, not as a constructor
    
    // 初始化执行状态
    this.state = {
      workflowId: workflow.id,
      status: WorkflowExecutionStatus.IDLE,
      currentNodeId: null,
      nodeResults: {},
      outputs: {},
      inputs: {},
      context: {},
      error: undefined
    };
    
    // 初始化节点执行状态
    workflow.nodes.forEach(node => {
      this.state.nodeResults[node.id] = {
        nodeId: node.id,
        status: NodeExecutionStatus.PENDING,
        output: undefined,
        error: undefined
      };
    });
  }
  
  /**
   * 获取当前执行状态
   * 用于UI组件获取最新的执行状态信息
   */
  getState(): WorkflowExecutionState {
    return { ...this.state };
  }
  
  /**
   * 开始执行工作流
   */
  public async execute(initialInputs: Record<string, any> = {}): Promise<WorkflowExecutionState> {
    if (this.state.status === WorkflowExecutionStatus.RUNNING) {
      return this.state;
    }
    
    // 重置状态
    this.state.status = WorkflowExecutionStatus.RUNNING;
    this.state.startTime = Date.now();
    this.state.inputs = initialInputs;
    this.state.error = undefined;
    this.state.outputs = {};
    this.shouldPause = false;
    this.shouldStop = false;
    
    // 重置节点状态
    this.workflow.nodes.forEach(node => {
      this.state.nodeResults[node.id] = {
        nodeId: node.id,
        status: NodeExecutionStatus.PENDING,
        output: undefined,
        error: undefined
      };
    });
    
    this._updateStatus(WorkflowExecutionStatus.RUNNING);
    
    try {
      this.executionPromise = this._executeWorkflow();
      const result = await this.executionPromise;
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.state.error = err.message;
      this.state.status = WorkflowExecutionStatus.FAILED;
      this.state.endTime = Date.now();
      
      if (this.state.startTime) {
        this.state.duration = this.state.endTime - this.state.startTime;
      }
      
      this._updateStatus(WorkflowExecutionStatus.FAILED);
      
      if (this.callbacks.onWorkflowError) {
        this.callbacks.onWorkflowError(err, this.state);
      }
      
      return this.state;
    } finally {
      this.executionPromise = null;
    }
  }
  
  /**
   * 暂停工作流执行
   */
  public pause(): void {
    if (this.state.status === WorkflowExecutionStatus.RUNNING) {
      this.shouldPause = true;
      this._updateStatus(WorkflowExecutionStatus.PAUSED);
    }
  }
  
  /**
   * 恢复工作流执行
   */
  public resume(): void {
    if (this.state.status === WorkflowExecutionStatus.PAUSED) {
      this.shouldPause = false;
      this._updateStatus(WorkflowExecutionStatus.RUNNING);
    }
  }
  
  /**
   * 停止工作流执行
   */
  public stop(): void {
    if (this.state.status === WorkflowExecutionStatus.RUNNING || 
        this.state.status === WorkflowExecutionStatus.PAUSED) {
      this.shouldStop = true;
      this._updateStatus(WorkflowExecutionStatus.IDLE);
    }
  }
  
  /**
   * 更新工作流执行状态
   */
  private _updateStatus(status: WorkflowExecutionStatus): void {
    this.state.status = status;
    
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(status, this.state);
    }
  }
  
  /**
   * 工作流执行的主逻辑
   */
  private async _executeWorkflow(): Promise<WorkflowExecutionState> {
    // 重置节点执行计数器
    this.nodeExecutionCount = {};
  
    // 找到起始节点
    const startNode = this.workflow.nodes.find(node => node.type === WorkflowNodeType.START);
    
    if (!startNode) {
      throw new Error('工作流缺少起始节点');
    }
    
    let currentNodeId = startNode.id;
    let currentInput = this.state.inputs.initial || '';
    
    // 执行工作流直到结束
    while (currentNodeId) {
      // 检查是否应该暂停或停止
      if (this.shouldStop) {
        break;
      }
      
      // 检查节点执行次数，防止无限循环
      if (!this.nodeExecutionCount[currentNodeId]) {
        this.nodeExecutionCount[currentNodeId] = 0;
      }
      
      this.nodeExecutionCount[currentNodeId]++;
      
      if (this.nodeExecutionCount[currentNodeId] > this.maxNodeExecutions) {
        throw new Error(`检测到可能的无限循环: 节点 ${currentNodeId} 已执行超过 ${this.maxNodeExecutions} 次`);
      }
      
      if (this.shouldPause) {
        // 暂停时等待恢复
        await new Promise<void>(resolve => {
          const checkResume = () => {
            if (!this.shouldPause || this.shouldStop) {
              resolve();
            } else {
              setTimeout(checkResume, 200);
            }
          };
          
          setTimeout(checkResume, 200);
        });
        
        if (this.shouldStop) {
          break;
        }
      }
      
      // 更新当前节点ID
      this.state.currentNodeId = currentNodeId;
      
      // 获取当前节点
      const currentNode = this.workflow.nodes.find(node => node.id === currentNodeId);
      if (!currentNode) {
        throw new Error(`找不到节点: ${currentNodeId}`);
      }
      
      try {
        // 通知节点开始执行
        if (this.callbacks.onNodeStart) {
          this.callbacks.onNodeStart(currentNodeId, this.state.context);
        }
        
        // 更新节点状态为执行中
        const nodeResult: NodeExecutionResult = {
          nodeId: currentNodeId,
          status: NodeExecutionStatus.RUNNING,
          startTime: Date.now()
        };
        
        this.state.nodeResults[currentNodeId] = nodeResult;
        
        // 执行当前节点
        let output;
        
        if (currentNode.type === WorkflowNodeType.END) {
          // 结束节点，设置最终输出
          output = currentInput;
          this.state.outputs.final = output;
        } else if (currentNode.type === WorkflowNodeType.START) {
          // 起始节点，使用初始输入
          output = this.state.inputs.initial || '';
        } else if (currentNode.type === WorkflowNodeType.AGENT) {
          // 执行智能体节点
          output = await this._executeAgentNode(currentNode, currentInput);
        } else if (currentNode.type === WorkflowNodeType.TOOL) {
          // 执行工具节点
          output = await this._executeToolNode(currentNode, currentInput);
        } else if (currentNode.type === WorkflowNodeType.CONDITION) {
          // 执行条件节点
          output = await this._executeConditionNode(currentNode, currentInput);
        } else {
          // 其他类型的节点，目前简单传递输入
          output = currentInput;
        }
        
        // 节点执行完成，更新结果
        const endTime = Date.now();
        nodeResult.status = NodeExecutionStatus.COMPLETED;
        nodeResult.output = output;
        nodeResult.endTime = endTime;
        
        if (nodeResult.startTime) {
          nodeResult.duration = endTime - nodeResult.startTime;
        }
        
        this.state.nodeResults[currentNodeId] = nodeResult;
        
        // 保存输出到上下文
        this.state.context[currentNodeId] = output;
        
        // 通知节点执行完成
        if (this.callbacks.onNodeComplete) {
          this.callbacks.onNodeComplete(nodeResult, this.state.context);
        }
        
        // 寻找下一个要执行的节点
        const nextNodeId = this._findNextNode(currentNodeId, output);
        
        if (!nextNodeId) {
          // 没有下一个节点，检查是否有结束节点
          const endNode = this.workflow.nodes.find(node => node.type === WorkflowNodeType.END);
          
          if (endNode && currentNode.type !== WorkflowNodeType.END) {
            // 如果存在结束节点但当前不是结束节点，则执行结束节点
            currentNodeId = endNode.id;
          } else {
            // 工作流执行完成
            break;
          }
        } else {
          currentNodeId = nextNodeId;
          currentInput = output;
        }
        
      } catch (error) {
        // 节点执行失败，更新状态
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        const nodeResult = this.state.nodeResults[currentNodeId];
        nodeResult.status = NodeExecutionStatus.FAILED;
        nodeResult.error = errorMessage;
        nodeResult.endTime = Date.now();
        
        if (nodeResult.startTime) {
          nodeResult.duration = nodeResult.endTime - nodeResult.startTime;
        }
        
        // 通知节点执行失败
        if (this.callbacks.onNodeComplete) {
          this.callbacks.onNodeComplete(nodeResult, this.state.context);
        }
        
        throw new Error(`节点执行失败: ${currentNodeId} - ${errorMessage}`);
      }
    }
    
    // 工作流执行完成，更新状态
    this.state.status = WorkflowExecutionStatus.COMPLETED;
    this.state.endTime = Date.now();
    
    if (this.state.startTime) {
      this.state.duration = this.state.endTime - this.state.startTime;
    }
    
    this._updateStatus(WorkflowExecutionStatus.COMPLETED);
    
    if (this.callbacks.onWorkflowComplete) {
      this.callbacks.onWorkflowComplete(this.state);
    }
    
    return this.state;
  }
  
  /**
   * 执行智能体节点
   */
  private async _executeAgentNode(
    node: WorkflowNode, 
    input: any
  ): Promise<any> {
    const agentId = node.type === WorkflowNodeType.AGENT ? 
      (node as any).agentId || (node.aiConfig?.params?.agentId as string) : 
      null;
    
    if (!agentId) {
      throw new Error('智能体节点缺少agentId配置');
    }
    
    try {
      // 获取智能体对象
      const agent = await agentService.getAgent(agentId);
      
      if (!agent) {
        throw new Error(`找不到智能体: ${agentId}`);
      }
      
      // 调用智能体处理输入
      const message = typeof input === 'string' ? input : JSON.stringify(input);
      
      // 添加超时保护
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('智能体执行超时')), 30000); // 30秒超时
      });

      // 使用MastraAPI的generate方法
      const result = await Promise.race([
        this.mastraAPI.generate(agentId, {
          messages: [
            { role: 'user', content: message }
          ],
          options: {
            temperature: agent.temperature || 0.7,
            max_tokens: agent.maxTokens || 2000
          }
        }),
        timeoutPromise
      ]);
      
      return result.text;
    } catch (error) {
      console.error('执行智能体节点失败:', error);
      throw new Error(`执行智能体节点失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 执行工具节点
   */
  private async _executeToolNode(
    node: WorkflowNode, 
    input: any
  ): Promise<any> {
    const toolId = node.type === WorkflowNodeType.TOOL ? 
      (node as any).toolId || (node.aiConfig?.params?.toolId as string) : 
      null;
    
    if (!toolId) {
      throw new Error('工具节点缺少toolId配置');
    }
    
    const toolParams = node.aiConfig?.params || {};
    
    try {
      // 构建工具参数
      const params = { ...toolParams };
      
      // 如果有输入，将其添加到参数中
      if (input !== undefined && input !== null) {
        // 如果工具参数中有标记为input的字段，将输入值赋给该字段
        const inputParam = Object.keys(params).find(key => params[key] === '{input}');
        if (inputParam) {
          params[inputParam] = input;
        } else {
          // 否则添加默认input参数
          params.input = input;
        }
      }
      
      // 执行工具
      const result = await toolService.executeTool(toolId, { data: params });
      return result;
    } catch (error) {
      console.error('执行工具节点失败:', error);
      throw new Error(`执行工具节点失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 执行条件节点
   */
  private async _executeConditionNode(
    node: WorkflowNode, 
    input: any
  ): Promise<boolean> {
    const condition = node.type === WorkflowNodeType.CONDITION ? 
      node.conditionConfig || node.aiConfig?.params?.condition : 
      null;
    
    if (!condition) {
      throw new Error('条件节点缺少condition配置');
    }
    
    try {
      // 处理不同类型的条件配置
      let result: boolean;
      
      if (typeof condition === 'string') {
        // 条件是一个简单的相等比较
        result = input === condition;
      } else if (typeof condition === 'function') {
        // 条件是一个函数
        result = condition(input);
      } else if (typeof condition === 'object' && condition !== null) {
        // 条件是一个对象，可能包含高级配置
        if ('operator' in condition && 'value' in condition) {
          const { operator, value } = condition;
          
          switch (operator) {
            case 'equals':
              result = input === value;
              break;
            case 'contains':
              result = String(input).includes(String(value));
              break;
            case 'greaterThan':
              result = Number(input) > Number(value);
              break;
            case 'lessThan':
              result = Number(input) < Number(value);
              break;
            default:
              result = false;
          }
        } else if ('type' in condition && 'leftOperand' in condition && 'operator' in condition && 'rightOperand' in condition) {
          // 使用conditionConfig格式
          const { leftOperand, operator, rightOperand } = condition;
          const leftValue = typeof input === 'object' && leftOperand ? input[leftOperand] : input;
          const rightValue = rightOperand;
          
          switch (operator) {
            case 'equals':
            case '==':
              result = leftValue == rightValue;
              break;
            case 'notEquals':
            case '!=':
              result = leftValue != rightValue;
              break;
            case 'greaterThan':
            case '>':
              result = leftValue > rightValue;
              break;
            case 'lessThan':
            case '<':
              result = leftValue < rightValue;
              break;
            case 'contains':
              result = String(leftValue).includes(String(rightValue));
              break;
            default:
              result = false;
          }
        } else {
          // 默认为JSON相等比较
          result = JSON.stringify(input) === JSON.stringify(condition);
        }
      } else {
        // 默认为布尔值转换
        result = Boolean(input);
      }
      
      return result;
    } catch (error) {
      console.error('执行条件节点失败:', error);
      throw new Error(`执行条件节点失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 查找下一个要执行的节点
   */
  private _findNextNode(currentNodeId: string, output: any): string | null {
    // 对于条件节点，根据输出值选择不同的路径
    const currentNode = this.workflow.nodes.find(node => node.id === currentNodeId);
    
    if (currentNode?.type === WorkflowNodeType.CONDITION) {
      // 条件节点，根据输出选择路径
      const conditionResult = Boolean(output);
      
      // 查找带有条件的边
      const edges = this.workflow.edges.filter(edge => edge.source === currentNodeId);
      
      if (edges.length === 0) {
        return null;
      }
      
      // 寻找匹配的边
      for (const edge of edges) {
        if (edge.condition === undefined || edge.condition === null) {
          // 没有条件的边作为默认路径
          continue;
        }
        
        // 将条件转换为布尔值进行比较
        let edgeCondition: boolean;
        if (typeof edge.condition === 'boolean') {
          edgeCondition = edge.condition;
        } else if (typeof edge.condition === 'string') {
          edgeCondition = edge.condition.toLowerCase() === 'true';
        } else if (typeof edge.condition === 'number') {
          edgeCondition = edge.condition !== 0;
        } else {
          edgeCondition = Boolean(edge.condition);
        }
        
        if (conditionResult === edgeCondition) {
          return edge.target;
        }
      }
      
      // 如果没有找到匹配的条件边，使用没有条件的边作为默认路径
      const defaultEdge = edges.find(edge => edge.condition === undefined || edge.condition === null);
      return defaultEdge?.target || null;
    } else {
      // 非条件节点，按照边的定义连接到下一个节点
      const nextEdge = this.workflow.edges.find(edge => edge.source === currentNodeId);
      return nextEdge?.target || null;
    }
  }
}

// 导出单例
export default WorkflowExecutor; 