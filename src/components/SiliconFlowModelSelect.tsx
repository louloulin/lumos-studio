import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelSettings } from '@/shared/types';
import { models } from '@/packages/models/siliconflow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';

export interface Props {
  model: ModelSettings['siliconCloudModel'];
  siliconflowCustomModel: ModelSettings['openaiCustomModel'];
  onChange(model: ModelSettings['siliconCloudModel'], siliconflowCustomModel: ModelSettings['openaiCustomModel']): void;
  className?: string;
}

export default function SiliconFlowModelSelect(props: Props) {
  const { t } = useTranslation();
  const [customModel, setCustomModel] = useState(props.siliconflowCustomModel || '');

  const handleModelChange = (value: string) => {
    if (value === 'custom-model') {
      props.onChange('custom-model', customModel);
    } else {
      props.onChange(value as any, props.siliconflowCustomModel);
    }
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setCustomModel(value);
    if (props.model === 'custom-model') {
      props.onChange('custom-model', value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="model-select">{t('model')}</Label>
        <Select
          value={props.model}
          onValueChange={handleModelChange}
        >
          <SelectTrigger id="model-select" className="w-full">
            <SelectValue placeholder={t('selectAModel')} />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
            <SelectItem key="custom-model" value="custom-model">
              {t('Custom Model')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {props.model === 'custom-model' && (
        <div className="space-y-2">
          <Label htmlFor="custom-model-name">{t('Custom Model Name')}</Label>
          <Input
            id="custom-model-name"
            type="text"
            value={customModel}
            onChange={handleCustomModelChange}
          />
        </div>
      )}
    </div>
  );
}
