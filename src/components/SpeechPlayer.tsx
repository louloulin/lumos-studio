import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Play, Pause, Volume2, Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { toast } from 'sonner';
import { MastraAPI } from '@/api/mastra';

interface SpeechPlayerProps {
  text: string;
  agentId: string;
  className?: string;
}

export function SpeechPlayer({ text, agentId, className = '' }: SpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [speed, setSpeed] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // 创建音频元素
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // 设置音频事件处理
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
      
      audioRef.current.onerror = (e) => {
        console.error('音频播放错误:', e);
        setIsPlaying(false);
        toast.error('语音播放失败，请重试');
      };
    }
    
    // 组件卸载时清理
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // 释放URL
      if (audioUrlRef.current && audioUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  // 监听音量和速度变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = speed;
    }
  }, [volume, speed]);

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      // 正在播放，暂停
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        // 检查是否已加载音频
        if (!audioUrlRef.current) {
          setIsLoading(true);
          
          // 使用Mastra API获取音频
          const audioUrl = await MastraAPI.speak(agentId, text);
          
          if (audioUrl && audioUrl !== 'success') {
            // 如果返回了URL，设置给音频元素
            audioRef.current.src = audioUrl;
            audioUrlRef.current = audioUrl;
          } else if (audioUrl === 'success') {
            // 如果是"success"，说明已经通过其他方式播放了
            setIsLoading(false);
            return;
          } else {
            throw new Error('未能获取语音URL');
          }
          
          setIsLoading(false);
        }
        
        // 播放音频
        audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('获取或播放音频时出错:', error);
        setIsLoading(false);
        toast.error('语音播放失败，请重试');
      }
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="rounded-full h-7 w-7"
        disabled={isLoading}
        onClick={togglePlayback}
        title={isPlaying ? '暂停' : '播放'}
      >
        {isLoading ? (
          <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full h-7 w-7"
            title="语音设置"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-3">
          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium mb-1.5">音量</div>
              <Slider
                value={[volume * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0] / 100)}
              />
            </div>
            <div>
              <div className="text-xs font-medium mb-1.5">语速</div>
              <Slider
                value={[speed * 100]}
                min={50}
                max={200}
                step={10}
                onValueChange={(value) => setSpeed(value[0] / 100)}
              />
              <div className="text-xs text-muted-foreground mt-1 text-center">
                {speed.toFixed(1)}x
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 