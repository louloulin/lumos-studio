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
        
        // 记录构造信息
        console.log(`[Mastra] 初始化Mastra模型, 智能体: ${options.mastraAgentName}, 温度: ${options.temperature}`);
    }

    async callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        try {
            console.log(`[Mastra] 开始调用智能体, 消息数: ${rawMessages.length}`);
            
            // 记录消息内容的简短摘要，便于调试
            const messageSummary = rawMessages.map(msg => ({
                role: msg.role,
                contentLength: msg.content.length,
                preview: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '')
            }));
            console.log(`[Mastra] 消息摘要:`, messageSummary);
            
            // Convert the messages to the format Mastra expects
            const processedMessages = rawMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Check if the Mastra service is running - 注意这已被修改为更可靠的检查
            console.log(`[Mastra] 检查Mastra服务状态...`);
            const isRunning = await MastraAPI.isRunning();
            
            // 即使服务状态检查失败，我们也尝试调用API
            console.log(`[Mastra] Mastra服务状态检查结果: ${isRunning ? '正常' : '异常'}`);

            // Call the Mastra API to generate a response
            const agentName = this.options.mastraAgentName;
            console.log(`[Mastra] 目标智能体: ${agentName}`);
            
            // For streaming support
            if (onResultChange) {
                let result = '';
                let startTime = Date.now();
                
                try {
                    console.log(`[Mastra] 开始流式生成请求...`);
                    // 使用MastraAPI的streamGenerate方法
                    const streamGenerator = MastraAPI.streamGenerate(agentName, {
                        messages: processedMessages,
                        options: {
                            temperature: this.options.temperature
                        }
                    });
                    
                    console.log(`[Mastra] 流式生成请求已发送, 等待响应...`);
                    
                    let chunkCount = 0;
                    for await (const chunk of streamGenerator) {
                        chunkCount++;
                        
                        // 记录首个chunk接收时间
                        if (result === '') {
                            const timeToFirstChunk = Date.now() - startTime;
                            console.log(`[Mastra] 收到首个响应块, 耗时: ${timeToFirstChunk}ms`);
                        }
                        
                        // 记录进度
                        if (chunkCount % 10 === 0 || result.length % 500 === 0) {
                            console.log(`[Mastra] 已接收${chunkCount}个响应块, 当前长度: ${result.length}`);
                        }
                        
                        if (signal?.aborted) {
                            console.log(`[Mastra] 流式生成被用户中断`);
                            break;
                        }
                        
                        if (chunk) {
                            result += chunk;
                            onResultChange(result);
                        }
                    }
                    
                    const totalTime = Date.now() - startTime;
                    console.log(`[Mastra] 流式生成完成, 总时间: ${totalTime}ms, 最终长度: ${result.length}`);
                    return result;
                } catch (streamError) {
                    console.error(`[Mastra] 流式生成错误:`, streamError);
                    
                    // 如果流式生成失败，尝试使用普通生成
                    try {
                        console.log(`[Mastra] 尝试使用普通生成作为备选...`);
                        startTime = Date.now();
                        
                        const response = await MastraAPI.generate(agentName, {
                            messages: processedMessages,
                            options: {
                                temperature: this.options.temperature
                            }
                        });
                        
                        const fallbackTime = Date.now() - startTime;
                        
                        if (!response || !response.text) {
                            console.error(`[Mastra] 普通生成返回无效结果:`, response);
                            throw new Error('Invalid response from Mastra API');
                        }
                        
                        console.log(`[Mastra] 普通生成成功, 耗时: ${fallbackTime}ms, 长度: ${response.text.length}`);
                        result = response.text;
                        onResultChange(result);
                        return result;
                    } catch (fallbackError) {
                        console.error(`[Mastra] 普通生成也失败:`, fallbackError);
                        throw fallbackError;
                    }
                    
                    throw streamError;
                }
            } else {
                // Use regular generate for non-streaming
                console.log(`[Mastra] 使用普通生成(非流式)...`);
                const startTime = Date.now();
                
                const response = await MastraAPI.generate(agentName, {
                    messages: processedMessages,
                    options: {
                        temperature: this.options.temperature
                    }
                });
                
                const generateTime = Date.now() - startTime;
                
                if (!response || !response.text) {
                    console.error(`[Mastra] 普通生成返回无效结果:`, response);
                    throw new Error('Invalid response from Mastra API');
                }
                
                console.log(`[Mastra] 普通生成成功, 耗时: ${generateTime}ms, 响应长度: ${response.text.length}`);
                return response.text;
            }
        } catch (error) {
            console.error('[Mastra] 生成错误:', error);
            
            // 记录详细错误信息
            if (error instanceof NetworkError) {
                console.error('[Mastra] 网络错误, 可能是连接问题或服务未运行');
            } else if (error instanceof ApiError) {
                console.error('[Mastra] API错误, 服务器返回错误');
            }
            
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