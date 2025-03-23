import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OpenAIModelType } from '@/shared/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';

type Props = {
  modelType: OpenAIModelType;
  onModelChange: (model: string) => void;
};

const OpenAIModelSelect: React.FC<Props> = ({ modelType, onModelChange }) => {
  const { t } = useTranslation();
  const [customModel, setCustomModel] = useState('');

  return (
    <div className="space-y-2">
      <Label htmlFor="openai-model-select">{t('modelName')}</Label>
      <Select
        value={
          modelType === OpenAIModelType.GPT3_5
            ? 'gpt-3.5-turbo'
            : modelType === OpenAIModelType.GPT4
            ? 'gpt-4'
            : modelType === OpenAIModelType.GPT4_TURBO
            ? 'gpt-4-turbo-preview'
            : modelType === OpenAIModelType.GPT4_VISION
            ? 'gpt-4-vision-preview'
            : modelType === OpenAIModelType.CUSTOM
            ? customModel
            : 'gpt-3.5-turbo'
        }
        onValueChange={(value: string) => {
          if (value === 'gpt-3.5-turbo') {
            onModelChange(OpenAIModelType.GPT3_5);
          } else if (value === 'gpt-4') {
            onModelChange(OpenAIModelType.GPT4);
          } else if (value === 'gpt-4-turbo-preview') {
            onModelChange(OpenAIModelType.GPT4_TURBO);
          } else if (value === 'gpt-4-vision-preview') {
            onModelChange(OpenAIModelType.GPT4_VISION);
          } else {
            onModelChange(OpenAIModelType.CUSTOM);
            setCustomModel(value);
          }
        }}
      >
        <SelectTrigger id="openai-model-select" className="w-full">
          <SelectValue placeholder={t('selectAModel')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
          <SelectItem value="gpt-4">gpt-4</SelectItem>
          <SelectItem value="gpt-4-turbo-preview">gpt-4-turbo-preview</SelectItem>
          <SelectItem value="gpt-4-vision-preview">gpt-4-vision-preview</SelectItem>
          {customModel && customModel !== 'gpt-3.5-turbo' && customModel !== 'gpt-4' && 
            customModel !== 'gpt-4-turbo-preview' && customModel !== 'gpt-4-vision-preview' && (
            <SelectItem value={customModel}>{customModel}</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default OpenAIModelSelect;
