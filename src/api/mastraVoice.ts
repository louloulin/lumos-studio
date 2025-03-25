import { MastraAPI } from './mastra';

/**
 * Mastra语音服务类
 * 提供与Mastra语音API集成的功能
 */
export class MastraVoiceService {
  /**
   * 使用智能体进行语音合成
   * @param agentId 智能体ID
   * @param text 要转换为语音的文本
   * @returns 语音数据URL
   */
  static async speakWithAgent(agentId: string, text: string): Promise<string> {
    try {
      console.log(`使用智能体 ${agentId} 进行语音合成: ${text}`);
      // 调用Mastra API的speak方法
      const audioUrl = await MastraAPI.speak(agentId, text);
      return audioUrl;
    } catch (error) {
      console.error('Mastra语音合成失败:', error);
      throw new Error('无法使用Mastra合成语音');
    }
  }

  /**
   * 将语音转换为文本
   * @param agentId 智能体ID
   * @param audioBlob 音频数据
   * @returns 转录的文本
   */
  static async listenWithAgent(agentId: string, audioBlob: Blob): Promise<string> {
    try {
      console.log(`使用智能体 ${agentId} 进行语音识别`);
      // 转换音频Blob为Base64
      const base64Audio = await blobToBase64(audioBlob);
      
      // 调用Mastra API的listen方法
      const transcription = await MastraAPI.listen(agentId, base64Audio);
      return transcription;
    } catch (error) {
      console.error('Mastra语音识别失败:', error);
      throw new Error('无法使用Mastra识别语音');
    }
  }
}

/**
 * 将Blob转换为Base64字符串
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // 移除data:audio/webm;base64,前缀
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 