import React from 'react';
import { ModelSettings } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import TemperatureSlider from '@/components/TemperatureSlider';
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClaudeModel, claudeModels } from '@/packages/models/claude';

interface ModelConfigProps {
  settingsEdit: ModelSettings;
  setSettingsEdit: (settings: ModelSettings) => void;
}

export default function ClaudeSetting(props: ModelConfigProps) {
  const { settingsEdit, setSettingsEdit } = props;
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="claude-api-key">{t('api key')}</Label>
        <div className="relative">
          <Input
            id="claude-api-key"
            type={showPassword ? "text" : "password"}
            value={settingsEdit.claudeApiKey}
            onChange={(e) => {
              setSettingsEdit({ ...settingsEdit, claudeApiKey: e.target.value });
            }}
            placeholder="sk-******************************"
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="claude-api-host">{t('api host')}</Label>
        <div className="flex">
          <Input
            id="claude-api-host"
            type="text"
            value={settingsEdit.claudeApiHost}
            placeholder="https://api.anthropic.com"
            onChange={(e) => {
              let value = e.target.value.trim();
              if (value.length > 4 && !value.startsWith('http')) {
                value = 'https://' + value;
              }
              setSettingsEdit({ ...settingsEdit, claudeApiHost: value });
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="ml-2"
            onClick={() => {
              setSettingsEdit({ ...settingsEdit, claudeApiHost: 'https://api.anthropic.com' });
            }}
          >
            {t('Reset')}
          </Button>
        </div>
      </div>

      <Accordion type="single" collapsible defaultValue="model-settings">
        <AccordionItem value="model-settings">
          <AccordionTrigger>
            {t('model')} & {t('token')}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="claude-model-select">{t('model')}</Label>
                <Select
                  value={settingsEdit.claudeModel}
                  onValueChange={(value) => setSettingsEdit({ ...settingsEdit, claudeModel: value as ClaudeModel })}
                >
                  <SelectTrigger id="claude-model-select" className="w-full">
                    <SelectValue placeholder={t('selectAModel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {claudeModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TemperatureSlider
                value={settingsEdit.temperature}
                onChange={(value) => setSettingsEdit({ ...settingsEdit, temperature: value })}
              />

              <MaxContextMessageCountSlider
                value={settingsEdit.openaiMaxContextMessageCount}
                onChange={(v) => setSettingsEdit({ ...settingsEdit, openaiMaxContextMessageCount: v })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
