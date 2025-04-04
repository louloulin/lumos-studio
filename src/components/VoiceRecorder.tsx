import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MastraAPI } from '@/api/mastra';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  agentId: string;
  maxRecordingTime?: number; // 最大录音时间(秒)
}

export function VoiceRecorder({ 
  onTranscription, 
  agentId,
  maxRecordingTime = 30 // 默认30秒
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // 清理函数
  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  // 将Blob转换为Base64字符串
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // 从data URL中提取base64部分（去掉前缀）
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // 确定最佳的录制格式
      const mimeTypes = [
        'audio/webm;codecs=opus', // 最佳格式，带有Opus编码
        'audio/webm',             // 通用WebM格式
        'audio/mp4',              // Safari支持
        'audio/ogg;codecs=opus',  // Firefox支持
        'audio/ogg'               // 通用Ogg格式
      ];
      
      // 找到浏览器支持的第一个格式
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      if (!mimeType) {
        toast.error('您的浏览器不支持任何录音格式');
        return;
      }
      
      console.log(`[VoiceRecorder] Using mime type: ${mimeType}`);
      
      // 创建MediaRecorder实例
      mediaRecorderRef.current = new MediaRecorder(stream, { 
        mimeType, 
        audioBitsPerSecond: 128000 // 128kbps，平衡质量和文件大小
      });
      
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        
        // 清除计时器
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingTime(0);

        try {
          if (audioChunksRef.current.length > 0) {
            // 合并音频块
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            
            if (audioBlob.size < 100) {
              toast.error('录音时长太短，请再试一次');
              setIsProcessing(false);
              return;
            }
            
            // 转换为Base64
            const audioBase64 = await blobToBase64(audioBlob);
            
            console.log(`[VoiceRecorder] Audio size: ${audioBlob.size} bytes, type: ${mimeType}`);
            
            // 使用Mastra API进行转录
            const text = await MastraAPI.listen(agentId, audioBase64);
            
            if (text && !text.includes('失败') && !text.includes('错误') && !text.includes('不可用')) {
              onTranscription(text);
              // 成功时不显示toast，让用户专注于输入框中出现的文本
            } else {
              // 显示API返回的错误消息
              toast.error(text || '无法识别语音，请重试或使用文本输入');
            }
          } else {
            toast.error('未检测到录音数据，请重试');
          }
        } catch (error) {
          console.error('处理音频时出错:', error);
          toast.error('处理音频时出错，请重试');
        } finally {
          setIsProcessing(false);
          
          // 停止所有轨道
          stream.getTracks().forEach(track => track.stop());
        }
      };

      // 开始录音
      mediaRecorderRef.current.start(1000); // 每秒获取一个数据块
      setIsRecording(true);
      
      // 设置录音时间限制
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxRecordingTime) {
            stopRecording();
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      toast.info(`开始录音，最长${maxRecordingTime}秒`);
      
    } catch (error) {
      console.error('开始录音时出错:', error);
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.error('无法访问麦克风，请在浏览器中允许麦克风访问权限');
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        toast.error('未找到麦克风设备，请确保您的设备有麦克风并正常工作');
      } else {
        toast.error('启动录音失败，请重试');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={`rounded-full ${isRecording ? 'bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700' : ''}`}
      disabled={isProcessing}
      onClick={isRecording ? stopRecording : startRecording}
      title={isRecording ? '停止录音' : '开始语音输入'}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
      {isRecording && recordingTime > 0 && (
        <span className="absolute top-0 right-0 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
          {maxRecordingTime - recordingTime}
        </span>
      )}
    </Button>
  );
} 