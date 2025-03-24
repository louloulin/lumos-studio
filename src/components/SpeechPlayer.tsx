import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from './ui/popover';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { useToast } from './ui/use-toast';
import { textToSpeech, getAvailableVoices, speakWithWebSpeech } from '../api/speech';

interface SpeechPlayerProps {
  text: string;
  disabled?: boolean;
  compact?: boolean;
}

const SpeechPlayer: React.FC<SpeechPlayerProps> = ({ text, disabled = false, compact = false }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [useBrowser, setUseBrowser] = useState(true);
  const { toast } = useToast();

  // 加载可用语音
  useEffect(() => {
    async function loadVoices() {
      try {
        const voices = await getAvailableVoices();
        setAvailableVoices(voices);
        
        // 尝试找到中文语音作为默认选项
        const chineseVoice = voices.find(v => 
          v.lang.startsWith('zh') || v.name.includes('Chinese') || v.name.includes('中文')
        );
        
        if (chineseVoice) {
          setSelectedVoice(chineseVoice.name);
        } else if (voices.length > 0) {
          setSelectedVoice(voices[0].name);
        }
      } catch (error) {
        console.error('加载语音列表失败:', error);
      }
    }
    
    loadVoices();
  }, []);

  // 应用语音合成设置 - 不需要在全局设置这些值
  useEffect(() => {
    // 保留effect依赖以保持响应式
  }, [volume, rate]);

  // 朗读文本
  const speak = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      setIsSpeaking(true);
      
      // 分割长文本为句子
      const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
      
      for (const sentence of sentences) {
        if (!isSpeaking) break; // 检查是否已停止朗读
        
        if (useBrowser) {
          // 自定义使用Web Speech API的方式，以便直接设置音量和速率
          const utterance = new SpeechSynthesisUtterance(sentence);
          utterance.volume = volume;
          utterance.rate = rate;
          
          // 如果选择了特定语音
          if (selectedVoice) {
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name === selectedVoice);
            if (voice) {
              utterance.voice = voice;
            }
          }
          
          // 等待语音播放完成
          await new Promise<void>((resolve, reject) => {
            utterance.onend = () => resolve();
            utterance.onerror = (e) => reject(new Error(`语音播放错误: ${e}`));
            window.speechSynthesis.speak(utterance);
          });
        } else {
          // 使用通用API
          await textToSpeech(sentence, {
            useBrowser: false,
            voice: selectedVoice
          });
        }
      }
    } catch (error) {
      console.error('语音合成错误:', error);
      toast({
        title: '语音播放失败',
        description: '无法播放语音，请检查浏览器设置或稍后再试。',
        variant: 'destructive',
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  // 停止朗读
  const stop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };
  
  // 紧凑模式下的渲染
  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled || !text.trim()}
        onClick={isSpeaking ? stop : speak}
        title={isSpeaking ? '停止朗读' : '朗读文本'}
      >
        {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </Button>
    );
  }

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled || !text.trim()}
        onClick={isSpeaking ? stop : speak}
        className="mr-2"
      >
        {isSpeaking ? <VolumeX className="mr-1" /> : <Volume2 className="mr-1" />}
        {isSpeaking ? '停止朗读' : '朗读文本'}
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" disabled={disabled}>
            <Settings size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="space-y-4">
            <h4 className="font-medium mb-2">语音设置</h4>
            
            <div className="space-y-2">
              <Label htmlFor="voice-select">选择语音</Label>
              <Select 
                value={selectedVoice} 
                onValueChange={setSelectedVoice}
                disabled={!useBrowser}
              >
                <SelectTrigger id="voice-select">
                  <SelectValue placeholder="选择语音" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map(voice => (
                    <SelectItem 
                      key={voice.name} 
                      value={voice.name}
                    >
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="volume-slider">音量</Label>
              <Slider
                id="volume-slider"
                value={[volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([value]) => setVolume(value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rate-slider">速度</Label>
              <Slider
                id="rate-slider"
                value={[rate]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={([value]) => setRate(value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="use-browser">使用浏览器合成</Label>
              <Switch
                id="use-browser"
                checked={useBrowser}
                onCheckedChange={setUseBrowser}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SpeechPlayer; 