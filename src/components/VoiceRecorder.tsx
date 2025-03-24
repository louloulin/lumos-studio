import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { transcribeAudio } from '../api/speech'; // 导入语音转录服务

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscript, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // 清理函数
  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
  };

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, []);

  // 开始录音
  const startRecording = async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 创建 MediaRecorder 实例
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // 设置数据处理器
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 设置录音结束处理器
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        
        try {
          // 创建音频 Blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // 使用我们的语音转录服务
          const transcript = await transcribeAudio(audioBlob);
          
          // 将转录文本发送给父组件
          onTranscript(transcript);
          
          toast({
            title: '语音转录完成',
            description: '您可以编辑转录文本后发送。',
          });
        } catch (error) {
          console.error('语音处理错误:', error);
          toast({
            title: '语音识别失败',
            description: '无法处理您的语音。请检查麦克风权限并重试。',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(false);
          
          // 停止所有轨道
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      // 开始录音
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: '开始录音',
        description: '请说话...',
      });
    } catch (error) {
      console.error('麦克风访问错误:', error);
      toast({
        title: '无法访问麦克风',
        description: '请确保您已授予麦克风访问权限。',
        variant: 'destructive',
      });
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div>
      {!isRecording && !isProcessing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={startRecording}
          disabled={disabled}
          title="语音输入"
        >
          <Mic size={16} className="mr-1" />
          语音输入
        </Button>
      )}
      
      {isRecording && (
        <Button
          variant="ghost"
          size="sm"
          onClick={stopRecording}
          className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
          title="停止录音"
        >
          <Square size={16} className="mr-1" />
          停止录音
        </Button>
      )}
      
      {isProcessing && (
        <Button
          variant="ghost"
          size="sm"
          disabled
          title="处理中..."
        >
          <Loader2 size={16} className="mr-1 animate-spin" />
          处理中...
        </Button>
      )}
    </div>
  );
};

export default VoiceRecorder; 