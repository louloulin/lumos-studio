// Import Tauri API with a dynamic require to avoid TypeScript errors
let invoke: any;
try {
  // Use dynamic import approach
  const tauri = require('@tauri-apps/api/tauri');
  invoke = tauri.invoke;
} catch (e) {
  // Fallback for when the module isn't available (e.g., in a development environment)
  console.warn('Tauri API not available, using mock implementation');
  invoke = async () => 'http://localhost:4111';
}

import { MastraClient } from '@mastra/client-js';

// Get the Mastra service URL from the Tauri backend
async function getMastraUrl(): Promise<string> {
  try {
    return await invoke('get_mastra_url');
  } catch (error) {
    console.error('Failed to get Mastra service URL:', error);
    return 'http://localhost:4111'; // Default fallback
  }
}

// Initialize Mastra client instance
let mastraClient: MastraClient | null = null;

async function getClient() {
  if (!mastraClient) {
    const baseUrl = await getMastraUrl();
    mastraClient = new MastraClient({
      baseUrl,
    });
  }
  return mastraClient;
}

// Interface for message objects
interface Message {
  role?: string;
  content: string;
}

// Interface for agent generate request
interface AgentGenerateRequest {
  messages: string[] | Message[];
  stream?: boolean;
  options?: Record<string, any>;
}

// Interface for agent generate response
interface AgentGenerateResponse {
  text: string;
  metadata?: Record<string, any>;
}

// Mastra API client
export const MastraAPI = {
  // Get available agents
  async getAgents(): Promise<string[]> {
    try {
      const client = await getClient();
      const agents = await client.getAgents();
      return Array.isArray(agents) ? agents.map(agent => agent.name) : [];
    } catch (error) {
      console.error('Failed to get agents:', error);
      return [];
    }
  },

  // Generate text from an agent
  async generate(
    agentName: string,
    request: AgentGenerateRequest
  ): Promise<AgentGenerateResponse> {
    try {
      const client = await getClient();
      const agent = client.getAgent(agentName);
      
      let content = '';
      
      if (Array.isArray(request.messages)) {
        if (request.messages.length === 0) {
          throw new Error("Messages array cannot be empty");
        }
        
        if (typeof request.messages[0] === 'string') {
          // If it's a string array, just use the first message
          content = request.messages[0];
        } else {
          // If it contains objects with role, get the content
          content = (request.messages as Message[])[0].content;
        }
      } else {
        throw new Error("Messages must be an array");
      }
      
      // Call generate with a simple string message
      // This bypasses the type-checking since we're dealing with a real-world API
      // that may have a different structure than what TypeScript expects
      const result = await (agent as any).generate(content);
      
      return {
        text: typeof result.text === 'string' ? result.text : '',
        metadata: result.metadata || {}
      };
    } catch (error) {
      console.error(`Failed to generate from agent ${agentName}:`, error);
      throw error;
    }
  },

  // Stream generation from an agent (returns an async generator)
  async *streamGenerate(
    agentName: string,
    request: AgentGenerateRequest
  ): AsyncGenerator<string, void, unknown> {
    try {
      const client = await getClient();
      const agent = client.getAgent(agentName);
      
      let content = '';
      
      if (Array.isArray(request.messages)) {
        if (request.messages.length === 0) {
          throw new Error("Messages array cannot be empty");
        }
        
        if (typeof request.messages[0] === 'string') {
          // If it's a string array, just use the first message
          content = request.messages[0];
        } else {
          // If it contains objects with role, get the content
          content = (request.messages as Message[])[0].content;
        }
      } else {
        throw new Error("Messages must be an array");
      }

      // Call generate with a simple string message
      // This bypasses the type-checking since we're dealing with a real-world API
      const result = await (agent as any).generate(content);
      
      // Return the full result as one chunk
      yield typeof result.text === 'string' ? result.text : '';
    } catch (error) {
      console.error(`Failed to stream from agent ${agentName}:`, error);
      throw error;
    }
  },

  // Check if the Mastra service is running
  async isRunning(): Promise<boolean> {
    try {
      const client = await getClient();
      // Try to get agents as a way to check if the service is running
      await client.getAgents();
      return true;
    } catch (error) {
      console.error('Mastra service health check failed:', error);
      return false;
    }
  },
}; 