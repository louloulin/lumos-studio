import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { weatherWorkflow } from './workflows';
import { agents } from './agents';
import { logger } from './logging/index';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: agents,
  logger: createLogger({
    name: 'Mastra',
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  }),
});

// Log startup information
logger.info('Lumos Studio Mastra service started');
logger.info('Ollama support added');

// Export the Mastra instance as default
export default mastra;
