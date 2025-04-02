/**
 * 工作流功能相关工具函数
 */

import { WorkflowNodeType } from '@/api/WorkflowService';
import { Node, Edge, MarkerType } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

/**
 * 将工作流节点类型转换为可读的标签
 */
export const getNodeTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    [WorkflowNodeType.START]: '开始节点',
    [WorkflowNodeType.END]: '结束节点',
    [WorkflowNodeType.AGENT]: '智能体节点',
    [WorkflowNodeType.TOOL]: '工具节点',
    [WorkflowNodeType.CONDITION]: '条件节点',
    [WorkflowNodeType.INPUT]: '输入节点',
    [WorkflowNodeType.OUTPUT]: '输出节点',
    [WorkflowNodeType.LOOP]: '循环节点',
    [WorkflowNodeType.FUNCTION]: '函数节点',
    [WorkflowNodeType.AI]: 'AI节点',
    [WorkflowNodeType.VARIABLE]: '变量节点',
    [WorkflowNodeType.KNOWLEDGE]: '知识库节点',
    [WorkflowNodeType.WEBHOOK]: 'Webhook节点',
    [WorkflowNodeType.API]: 'API节点',
    [WorkflowNodeType.MESSAGE]: '消息节点'
  };
  
  return typeMap[type] || type;
};

/**
 * 获取节点类型对应的颜色
 */
export const getNodeTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    [WorkflowNodeType.START]: '#10b981', // 绿色
    [WorkflowNodeType.END]: '#ef4444', // 红色
    [WorkflowNodeType.AGENT]: '#3b82f6', // 蓝色
    [WorkflowNodeType.TOOL]: '#8b5cf6', // 紫色
    [WorkflowNodeType.CONDITION]: '#f59e0b', // 黄色
    [WorkflowNodeType.INPUT]: '#06b6d4', // 青色
    [WorkflowNodeType.OUTPUT]: '#6366f1', // 靛蓝色
    [WorkflowNodeType.LOOP]: '#ec4899', // 粉色
    [WorkflowNodeType.FUNCTION]: '#8b5cf6', // 紫色
    [WorkflowNodeType.AI]: '#0ea5e9', // 蓝色
    [WorkflowNodeType.VARIABLE]: '#f59e0b', // 黄色
    [WorkflowNodeType.KNOWLEDGE]: '#6366f1', // 靛蓝色
    [WorkflowNodeType.WEBHOOK]: '#f43f5e', // 玫红色
    [WorkflowNodeType.API]: '#0891b2', // 蓝绿色
    [WorkflowNodeType.MESSAGE]: '#d946ef' // 品红色
  };
  
  return colorMap[type] || '#64748b'; // 默认灰色
};

/**
 * 获取节点状态对应的颜色
 */
export const getNodeStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
    'pending': '#94a3b8', // 灰色
    'running': '#3b82f6', // 蓝色
    'completed': '#10b981', // 绿色
    'failed': '#ef4444', // 红色
    'skipped': '#8b5cf6' // 紫色
  };
  
  return statusColorMap[status] || statusColorMap.pending;
};

/**
 * 创建新的工作流节点
 */
export const createWorkflowNode = (
  type: string,
  position: { x: number, y: number } = { x: 0, y: 0 },
  data: any = {}
) => {
  return {
    id: uuidv4(),
    type,
    position,
    name: getNodeTypeLabel(type),
    description: '',
    ...data
  };
};

/**
 * 将工作流节点转换为ReactFlow节点
 */
export const workflowToReactFlowNodes = (
  workflowNodes: any[],
  onNodeClick?: (nodeId: string) => void
): Node[] => {
  return workflowNodes.map(node => {
    let nodeType = 'default';
    
    // 根据节点类型选择不同的节点视图
    switch (node.type) {
      case WorkflowNodeType.START:
      case WorkflowNodeType.END:
        nodeType = 'circle';
        break;
      case WorkflowNodeType.AGENT:
        nodeType = 'agent';
        break;
      case WorkflowNodeType.TOOL:
        nodeType = 'tool';
        break;
      case WorkflowNodeType.CONDITION:
        nodeType = 'condition';
        break;
      case WorkflowNodeType.LOOP:
        nodeType = 'loop';
        break;
      case WorkflowNodeType.INPUT:
        nodeType = 'input';
        break;
      case WorkflowNodeType.OUTPUT:
        nodeType = 'output';
        break;
      case WorkflowNodeType.AI:
        nodeType = 'ai';
        break;
      case WorkflowNodeType.FUNCTION:
        nodeType = 'function';
        break;
      case WorkflowNodeType.VARIABLE:
        nodeType = 'variable';
        break;
      default:
        nodeType = 'default';
        break;
    }

    return {
      id: node.id,
      type: nodeType,
      position: node.position || { x: 0, y: 0 },
      data: { 
        ...node,
        onNodeClick
      },
      className: `bg-white dark:bg-slate-800 border-2 border-${getNodeTypeColor(node.type)}/50 shadow-sm`
    };
  });
};

/**
 * 将工作流边转换为ReactFlow边
 */
export const workflowToReactFlowEdges = (workflowEdges: any[]): Edge[] => {
  return workflowEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label || '',
    type: 'smoothstep',
    data: { ...edge },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#64748b',
    },
    style: {
      strokeWidth: 2,
      stroke: '#64748b',
    },
  }));
}; 