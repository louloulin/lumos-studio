import React, { useState } from 'react';
import { ModelSettings } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import TemperatureSlider from '@/components/TemperatureSlider';
import TopPSlider from '@/components/TopPSlider';
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider';
import PPIOModelSelect from '@/components/PPIOModelSelect';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

interface ModelConfigProps {
  settingsEdit: ModelSettings;
  setSettingsEdit: (settings: ModelSettings) => void;
}

export default function PPIOSetting(props: ModelConfigProps) {
  const { settingsEdit, setSettingsEdit } = props;
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ppio-api-key">{t('api key')}</Label>
        <div className="relative">
          <Input
            id="ppio-api-key"
            type={showPassword ? "text" : "password"}
            value={settingsEdit.ppioKey}
            onChange={(e) => {
              setSettingsEdit({ ...settingsEdit, ppioKey: e.target.value });
            }}
            placeholder="ppio-******************************"
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
        <Label htmlFor="ppio-api-host">{t('api host')}</Label>
        <div className="flex">
          <Input
            id="ppio-api-host"
            type="text"
            value={settingsEdit.ppioHost}
            placeholder="https://api.ppio.dev"
            onChange={(e) => {
              let value = e.target.value.trim();
              if (value.length > 4 && !value.startsWith('http')) {
                value = 'https://' + value;
              }
              setSettingsEdit({ ...settingsEdit, ppioHost: value });
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="ml-2"
            onClick={() => {
              setSettingsEdit({ ...settingsEdit, ppioHost: 'https://api.ppio.dev' });
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
              <PPIOModelSelect
                model={settingsEdit.ppioModel}
                ppioHost={settingsEdit.ppioHost}
                onChange={(model) =>
                  setSettingsEdit({ ...settingsEdit, ppioModel: model })
                }
              />

              <TemperatureSlider
                value={settingsEdit.temperature}
                onChange={(value) => setSettingsEdit({ ...settingsEdit, temperature: value })}
              />
              
              <TopPSlider
                topP={settingsEdit.topP}
                setTopP={(v) => setSettingsEdit({ ...settingsEdit, topP: v })}
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