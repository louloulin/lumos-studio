import type { Config } from 'drizzle-kit';

export default {
  schema: './src/mastra/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: 'file:agent.db',
  },
} satisfies Config; 