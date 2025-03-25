import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from '@/hooks/use-toast';

interface ImageUploadInputProps {
  onSend: (text: string, images: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  onSend,
  disabled = false,
  placeholder = "输入消息..."
}) => {
  const [input, setInput] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: '不支持的文件类型',
          description: '请上传图片文件 (JPG, PNG, GIF等)',
          variant: 'destructive'
        });
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: '文件过大',
          description: '图片大小不能超过5MB',
          variant: 'destructive'
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const base64String = e.target.result.toString();
          setUploadedImages(prev => [...prev, base64String]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!input.trim() && uploadedImages.length === 0) return;
    
    onSend(input, uploadedImages);
    setInput('');
    setUploadedImages([]);
  };

  return (
    <div className="w-full">
      {/* Upload preview area */}
      {uploadedImages.length > 0 && (
        <div className="p-2 border-t flex gap-2 overflow-x-auto">
          {uploadedImages.map((img, index) => (
            <div key={`preview-${index}`} className="relative group">
              <img 
                src={img} 
                alt={`Preview ${index + 1}`} 
                className="h-20 w-20 object-cover rounded border border-border"
              />
              <button 
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-90 hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Input area */}
      <div className="flex items-center">
        <div className="flex-1 relative">
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-20" // Make space for the image upload button
          />
          
          {/* Image upload button */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <label 
              htmlFor="image-upload" 
              className={cn(
                "inline-flex items-center justify-center p-1 rounded-md text-sm font-medium cursor-pointer",
                "hover:bg-accent hover:text-accent-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <ImageIcon className="h-5 w-5" />
              <span className="sr-only">上传图片</span>
            </label>
            <input
              id="image-upload"
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              disabled={disabled}
              className="hidden"
              multiple
            />
          </div>
        </div>
        
        <Button
          size="icon"
          disabled={disabled || (input.trim() === '' && uploadedImages.length === 0)}
          onClick={handleSubmit}
          className="ml-2"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ImageUploadInput; 