import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { weatherWorkflow } from './workflows';
import { agents } from './agents';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: agents,
  logger: createLogger({
    name: 'Mastra',
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  }),
  serverMiddleware: [
    {
      handler: async (c, next) => {
        c.header('Access-Control-Allow-Origin', '*');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-mastra-client-type, x-mastra-client-id');
        
        if (c.req.method === 'OPTIONS') {
          return new Response(null, { status: 204 });
        }
        
        await next();
      }
    },
    {
      handler: async (c, next) => {
        console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
        const start = Date.now();
        await next();
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${duration}ms`);
      },
    }
  ]
});
