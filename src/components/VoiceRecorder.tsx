import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MastraAPI } from '@/api/mastra';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  agentId: string;
}

export function VoiceRecorder({ onTranscription, agentId }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 清理函数
  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
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
        // 从data URL中提取base64部分（去掉"data:audio/webm;base64,"前缀）
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);

        try {
          if (audioChunksRef.current.length > 0) {
            // 合并音频块
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            // 转换为Base64
            const audioBase64 = await blobToBase64(audioBlob);
            
            // 使用Mastra API进行转录
            const text = await MastraAPI.listen(agentId, audioBase64);
            
            if (text) {
              onTranscription(text);
            } else {
              toast.error('无法识别语音，请重试或使用文本输入');
            }
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

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('开始录音时出错:', error);
      toast.error('无法访问麦克风，请检查浏览器权限设置');
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
    </Button>
  );
} 