import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { weatherWorkflow } from './workflows';
import { agents } from './agents';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: agents,
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
