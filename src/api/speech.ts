// Import Tauri API with a dynamic require to avoid TypeScript errors
let invoke: any = async () => {
  console.warn('Default Tauri invoke is being used, this should be replaced');
  return null;
};

// 尝试异步导入Tauri API
const loadTauriAPI = async () => {
  try {
    // 使用动态导入以避免类型错误
    const tauri = await import('@tauri-apps/api/core');
    if (tauri && typeof tauri.invoke === 'function') {
      invoke = tauri.invoke;
      return true;
    }
    throw new Error('Tauri API loaded but invoke is not a function');
  } catch (e) {
    console.warn('Failed to import tauri API:', e);
    // Fallback for when the module isn't available
    return false;
  }
};

// 初始化加载
loadTauriAPI().catch(e => {
  console.error('Failed to initialize Tauri API:', e);
});

/**
 * 使用浏览器内置Web Speech API进行语音识别
 * @param audioBlob 录制的音频Blob
 * @returns 转录的文本
 */
export async function transcribeAudioWithWebSpeech(language = 'zh-CN'): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window)) {
      reject(new Error('您的浏览器不支持语音识别功能'));
      return;
    }

    // @ts-ignore - 使用WebKit Speech API
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      reject(new Error(`语音识别错误: ${event.error}`));
      recognition.stop();
    };

    recognition.onend = () => {
      resolve(finalTranscript);
    };

    recognition.start();

    // 设置30秒超时
    setTimeout(() => {
      if (recognition) {
        recognition.stop();
      }
    }, 30000);
  });
}

/**
 * 使用OpenAI Whisper API转录音频
 * @param audioBlob 录制的音频Blob
 * @returns 转录的文本
 */
export async function transcribeAudioWithWhisper(audioBlob: Blob): Promise<string> {
  try {
    // 确保Tauri API已加载
    await loadTauriAPI().catch(() => {});
    
    // 调用Tauri后端的转录函数
    const result = await invoke('transcribe_audio', { 
      audio: await blobToBase64(audioBlob)
    });
    
    if (result && typeof result === 'string') {
      return result;
    }
    
    // 模拟实现（实际项目中会调用真实API）
    return "这是通过Whisper API转录的文本。在实际项目中，这里应该从API获取真实的转录结果。";
  } catch (error) {
    console.error('Whisper API调用失败:', error);
    throw new Error('语音转录失败，请稍后再试');
  }
}

/**
 * 使用Mastra语音服务转录音频
 * @param audioBlob 录制的音频Blob
 * @returns 转录的文本
 */
export async function transcribeAudioWithMastra(audioBlob: Blob): Promise<string> {
  try {
    // 这里应该使用Mastra的语音转录API
    // 由于我们这里只是演示，使用模拟实现
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用延迟
    
    return "这是通过Mastra语音服务转录的文本。在实际项目中，这里应该从Mastra语音API获取真实的转录结果。";
  } catch (error) {
    console.error('Mastra语音服务调用失败:', error);
    throw new Error('语音转录失败，请稍后再试');
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

/**
 * 默认的音频转录函数，会尝试不同的方法
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // 尝试使用Mastra语音服务
    return await transcribeAudioWithMastra(audioBlob);
  } catch (error) {
    console.warn('Mastra语音服务失败，尝试Whisper API:', error);
    
    try {
      // 尝试使用Whisper API
      return await transcribeAudioWithWhisper(audioBlob);
    } catch (whisperError) {
      console.warn('Whisper API失败，使用浏览器内置语音识别:', whisperError);
      
      // 使用浏览器内置语音识别作为备选
      return "语音识别失败，请重试或直接输入文本。";
    }
  }
}

/**
 * 使用浏览器内置Web Speech API进行文本转语音
 * @param text 要转换为语音的文本
 * @param language 语言代码
 * @param voice 语音名称
 */
export function speakWithWebSpeech(text: string, language = 'zh-CN', voice?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('您的浏览器不支持语音合成功能'));
      return;
    }
    
    // 创建语音合成实例
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    // 如果指定了语音，尝试使用它
    if (voice) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
    // 语音结束时解析Promise
    utterance.onend = () => {
      resolve();
    };
    
    // 发生错误时拒绝Promise
    utterance.onerror = (event) => {
      reject(new Error(`语音合成错误: ${event.error}`));
    };
    
    // 开始语音合成
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * 使用Mastra语音服务进行文本转语音
 * @param text 要转换为语音的文本
 * @param voice 语音选项
 */
export async function speakWithMastra(text: string, voice?: string): Promise<string> {
  try {
    // 确保Tauri API已加载
    await loadTauriAPI().catch(() => {});
    
    // 调用Tauri后端的TTS函数
    const result = await invoke('text_to_speech', { 
      text,
      voice: voice || 'default'
    });
    
    if (result && typeof result === 'string') {
      return result; // 返回音频URL或base64
    }
    
    // 模拟实现（实际项目中会调用真实API）
    console.log('Mastra TTS服务模拟:', text);
    return "data:audio/mp3;base64,MOCK_AUDIO_DATA"; // 模拟音频数据
  } catch (error) {
    console.error('Mastra TTS服务调用失败:', error);
    throw new Error('语音合成失败，请稍后再试');
  }
}

/**
 * 获取可用的语音列表
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    
    // 如果语音已加载，直接返回
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    
    // 否则监听voiceschanged事件
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      resolve(voices);
    };
    
    // 防止事件不触发，设置超时
    setTimeout(() => {
      voices = window.speechSynthesis.getVoices();
      resolve(voices);
    }, 1000);
  });
}

/**
 * 播放一段音频
 * @param audioSrc 音频源URL或base64
 */
export function playAudio(audioSrc: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioSrc);
    
    audio.onended = () => {
      resolve();
    };
    
    audio.onerror = (error) => {
      reject(new Error(`音频播放错误: ${error}`));
    };
    
    audio.play().catch(error => {
      reject(new Error(`音频播放错误: ${error.message}`));
    });
  });
}

/**
 * 默认的TTS函数，会尝试不同的方法
 * @param text 要转换为语音的文本
 * @param options 选项
 */
export async function textToSpeech(
  text: string, 
  options: {
    useBrowser?: boolean;
    language?: string;
    voice?: string;
  } = {}
): Promise<void> {
  const { useBrowser = true, language = 'zh-CN', voice } = options;
  
  try {
    if (useBrowser) {
      // 尝试使用浏览器内置TTS
      await speakWithWebSpeech(text, language, voice);
      return;
    }
    
    // 尝试使用Mastra语音服务
    const audioSrc = await speakWithMastra(text, voice);
    await playAudio(audioSrc);
    
  } catch (error) {
    console.warn('TTS服务失败，尝试浏览器内置TTS:', error);
    
    try {
      // 回退到浏览器内置TTS
      await speakWithWebSpeech(text, language);
    } catch (webSpeechError) {
      console.error('所有TTS方法都失败:', webSpeechError);
      throw new Error('无法将文本转换为语音，请检查浏览器设置');
    }
  }
} 