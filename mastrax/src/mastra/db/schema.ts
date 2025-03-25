import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 智能体表
export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  instructions: text('instructions'),
  model: text('model'),
  temperature: integer('temperature'),
  maxTokens: integer('max_tokens'),
  tools: text('tools'), // JSON string
  systemAgent: integer('system_agent').default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// 日志表
export const agentLogs = sqliteTable('agent_logs', {
  id: text('id').primaryKey(),
  agentId: text('agent_id')
    .notNull()
    .references(() => agents.id),
  operation: text('operation').notNull(),
  timestamp: integer('timestamp').notNull(),
  details: text('details'), // JSON string
  status: text('status', { enum: ['success', 'error'] }).notNull(),
  error: text('error'),
});

export type Agent = typeof agents.$inferSelect;
export type AgentLog = typeof agentLogs.$inferSelect; 