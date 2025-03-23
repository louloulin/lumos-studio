import { Message, MessageRole } from '@/shared/types'
import Base, { onResultChange } from './base'
import { BaseError, ApiError, NetworkError } from './errors'
import { MastraAPI } from '@/api/mastra'

interface Options {
    mastraAgentName: string
    temperature: number
}

interface Config {
    uuid: string
}

export default class Mastra extends Base {
    public name = 'Mastra'

    public options: Options
    public config: Config
    
    constructor(options: Options, config: Config) {
        super()
        this.options = options
        this.config = config
    }

    async callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        try {
            // Convert the messages to the format Mastra expects
            const processedMessages = rawMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Check if the Mastra service is running
            const isRunning = await MastraAPI.isRunning();
            if (!isRunning) {
                throw new Error('Mastra service is not running');
            }

            // Call the Mastra API to generate a response
            const agentName = this.options.mastraAgentName;
            
            // For streaming support
            if (onResultChange) {
                let result = '';
                // Use stream generate
                const generator = MastraAPI.streamGenerate(agentName, {
                    messages: processedMessages,
                    stream: true,
                    options: {
                        temperature: this.options.temperature
                    }
                });
                
                for await (const chunk of generator) {
                    result += chunk;
                    onResultChange(result);
                    
                    // Check if aborted
                    if (signal?.aborted) {
                        break;
                    }
                }
                
                return result;
            } else {
                // Use regular generate for non-streaming
                const response = await MastraAPI.generate(agentName, {
                    messages: processedMessages,
                    options: {
                        temperature: this.options.temperature
                    }
                });
                
                return response.text;
            }
        } catch (error) {
            console.error('Mastra generation error:', error);
            if (error instanceof BaseError) {
                throw error;
            } else {
                const err = error as Error;
                throw new ApiError(err.message);
            }
        }
    }
}

export interface MastraMessage {
    role: MessageRole
    content: string
}

export async function populateMastraMessage(rawMessages: Message[]): Promise<MastraMessage[]> {
    const messages: MastraMessage[] = [];
    for (const raw of rawMessages) {
        const newMessage: MastraMessage = {
            role: raw.role,
            content: raw.content,
        };
        messages.push(newMessage);
    }
    return messages;
} 