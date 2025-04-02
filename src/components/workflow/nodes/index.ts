import StringNode from './StringNode';
import FunctionNode from './FunctionNode';
import TriggerNode from './TriggerNode';
import VariableNode from './VariableNode';
import AINode from './AINode';
import CircleNode from './CircleNode';
import DefaultNode from './DefaultNode';
import AgentNode from './AgentNode';
import ToolNode from './ToolNode';
import ConditionNode from './ConditionNode';
import LoopNode from './LoopNode';
import InputNode from './InputNode';
import OutputNode from './OutputNode';
import { AINodeEditor } from './AINodeEditor';
import { StringNodeEditor } from './StringNodeEditor';
import { FunctionNodeEditor } from './FunctionNodeEditor';
import { VariableNodeEditor } from './VariableNodeEditor';
import { TriggerNodeEditor } from './TriggerNodeEditor';

export {
  StringNode,
  FunctionNode,
  TriggerNode,
  VariableNode,
  AINode,
  CircleNode,
  DefaultNode,
  AgentNode,
  ToolNode,
  ConditionNode,
  LoopNode,
  InputNode,
  OutputNode,
  AINodeEditor,
  StringNodeEditor,
  FunctionNodeEditor,
  VariableNodeEditor,
  TriggerNodeEditor
};

export const NODE_TYPES = {
  string: StringNode,
  function: FunctionNode,
  trigger: TriggerNode,
  variable: VariableNode,
  ai: AINode,
  circle: CircleNode,
  default: DefaultNode,
  agent: AgentNode,
  tool: ToolNode,
  condition: ConditionNode,
  loop: LoopNode,
  input: InputNode,
  output: OutputNode
}; 