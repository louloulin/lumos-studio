import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Send, Wand2 } from 'lucide-react';
import { MastraAPI } from '../api/mastra';
import { MastraMessage } from '../api/types';
import { toast } from './ui/use-toast';

// 声明全局SpeechRecognition类型
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceChatProps {
  sessionId: string;
  agentId: string;
  onMessageSent?: (text: string, response: string) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ sessionId, agentId, onMessageSent }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [response, setResponse] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 初始化语音识别
  useEffect(() => {
    // 检查浏览器是否支持SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: '不支持语音识别',
        description: '您的浏览器不支持语音识别功能，请尝试使用Chrome浏览器。',
        variant: 'destructive',
      });
      return;
    }
    
    // 创建语音识别实例
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'zh-CN'; // 设置语言为中文
    
    // 处理识别结果
    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      setTranscript(transcript);
    };
    
    // 处理错误
    recognitionRef.current.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      toast({
        title: '语音识别错误',
        description: `发生错误: ${event.error}`,
        variant: 'destructive',
      });
      stopRecording();
    };
    
    // 清理函数
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);
  
  // 开始录音
  const startRecording = async () => {
    try {
      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 创建MediaRecorder实例
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      // 收集音频数据
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 录音结束处理
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // 关闭媒体流的所有轨道
        stream.getTracks().forEach(track => track.stop());
      };
      
      // 开始录音
      mediaRecorderRef.current.start();
      
      // 开始语音识别
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      setIsRecording(true);
      setTranscript('');
    } catch (error) {
      console.error('获取麦克风权限失败:', error);
      toast({
        title: '麦克风访问失败',
        description: '无法访问麦克风，请确保您的设备有麦克风并且已授予权限。',
        variant: 'destructive',
      });
    }
  };
  
  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsRecording(false);
  };
  
  // 发送语音消息
  const sendVoiceMessage = async () => {
    if (!transcript.trim()) {
      toast({
        title: '空消息',
        description: '请先录制语音内容。',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // 准备消息数据
      const mastraMessages: MastraMessage[] = [
        { role: 'user', content: transcript }
      ];
      
      // 获取智能体响应
      let fullResponse = '';
      
      // 使用流式API获取回复
      try {
        for await (const chunk of MastraAPI.streamGenerate(agentId, {
          messages: mastraMessages,
          options: {
            temperature: 0.7,
            max_tokens: 2048
          }
        })) {
          // 更新响应内容
          fullResponse += chunk;
          setResponse(fullResponse);
        }
        
        // 通知父组件
        if (onMessageSent) {
          onMessageSent(transcript, fullResponse);
        }
        
        // 自动播放响应语音
        playResponse(fullResponse);
      } catch (error) {
        console.error('Error in stream generation:', error);
        
        // 如果流式生成失败，尝试非流式API
        try {
          const response = await MastraAPI.generate(agentId, {
            messages: mastraMessages,
            options: {
              temperature: 0.7,
              max_tokens: 2048
            }
          });
          
          setResponse(response.text);
          
          // 通知父组件
          if (onMessageSent) {
            onMessageSent(transcript, response.text);
          }
          
          // 自动播放响应语音
          playResponse(response.text);
        } catch (generateError) {
          console.error('Error in normal generation:', generateError);
          
          toast({
            title: '生成回复失败',
            description: '无法获取智能体响应，请稍后再试。',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('处理语音消息失败:', error);
      toast({
        title: '处理失败',
        description: '处理语音消息时出错，请稍后再试。',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 播放响应语音
  const playResponse = async (text: string) => {
    try {
      // 使用系统自带的语音合成API
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN'; // 设置语言为中文
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (event) => {
        console.error('语音合成错误:', event);
        setIsPlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('语音合成失败:', error);
      toast({
        title: '语音合成失败',
        description: '无法合成语音响应，请检查浏览器是否支持语音合成。',
        variant: 'destructive',
      });
    }
  };
  
  // 取消播放语音
  const stopPlaying = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };
  
  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">语音对话</h3>
      
      {/* 语音输入区域 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Button 
            variant={isRecording ? "destructive" : "default"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <span className="text-sm">
            {isRecording ? '正在录音...' : '点击开始录音'}
          </span>
        </div>
        
        <div className="p-3 min-h-24 rounded-md border bg-muted/50">
          {transcript || '您的语音将显示在这里...'}
        </div>
        
        {audioUrl && (
          <div className="mt-2">
            <audio ref={audioRef} src={audioUrl} controls className="w-full h-10" />
          </div>
        )}
      </div>
      
      {/* 发送按钮 */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setTranscript('')}
          disabled={!transcript || isProcessing}
        >
          清除
        </Button>
        <Button
          onClick={sendVoiceMessage}
          disabled={!transcript || isProcessing}
          className="flex gap-1"
        >
          <Send className="h-4 w-4" />
          发送
        </Button>
      </div>
      
      {/* 响应区域 */}
      {response && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">AI 响应:</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={isPlaying ? stopPlaying : () => playResponse(response)}
              disabled={isProcessing}
            >
              {isPlaying ? '停止播放' : '播放语音'}
              <Wand2 className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="p-3 rounded-md border bg-primary/10">
            {response}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChat; 