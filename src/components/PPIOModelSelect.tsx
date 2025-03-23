import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelSettings } from '@/shared/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';

export interface Props {
  model: ModelSettings['ppioModel'];
  ppioHost: string;
  onChange(model: string): void;
  className?: string;
}

export default function PPIOModelSelect(props: Props) {
  const { t } = useTranslation();
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${props.ppioHost}/models`);
        const data = await response.json();
        if (data.data) {
          const modelIds = data.data.map((m: any) => m.id);
          setModels(modelIds);
        }
      } catch (error) {
        console.error('Failed to fetch PPIO models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, [props.ppioHost]);

  return (
    <div className="space-y-2">
      <Label htmlFor="model-select">{t('model')}</Label>
      <Select
        value={props.model}
        onValueChange={props.onChange}
        disabled={loading}
      >
        <SelectTrigger id="model-select" className="w-full">
          <SelectValue placeholder={loading ? t('Loading...') : t('selectAModel')} />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 