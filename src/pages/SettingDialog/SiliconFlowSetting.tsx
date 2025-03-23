import React, { useState } from 'react';
import { ModelSettings } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import TemperatureSlider from '@/components/TemperatureSlider';
import TopPSlider from '@/components/TopPSlider';
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider';
import SiliconFlowModelSelect from '@/components/SiliconFlowModelSelect';
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

export default function SiliconFlowSetting(props: ModelConfigProps) {
  const { settingsEdit, setSettingsEdit } = props;
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="siliconflow-api-key">{t('api key')}</Label>
        <div className="relative">
          <Input
            id="siliconflow-api-key"
            type={showPassword ? "text" : "password"}
            value={settingsEdit.siliconCloudKey}
            onChange={(e) => {
              setSettingsEdit({ ...settingsEdit, siliconCloudKey: e.target.value });
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
        <Label htmlFor="siliconflow-api-host">{t('api host')}</Label>
        <div className="flex">
          <Input
            id="siliconflow-api-host"
            type="text"
            value={settingsEdit.siliconCloudHost}
            placeholder="https://api.siliconflow.com"
            onChange={(e) => {
              let value = e.target.value.trim();
              if (value.length > 4 && !value.startsWith('http')) {
                value = 'https://' + value;
              }
              setSettingsEdit({ ...settingsEdit, siliconCloudHost: value });
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="ml-2"
            onClick={() => {
              setSettingsEdit({ ...settingsEdit, siliconCloudHost: 'https://api.siliconflow.com' });
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
              <SiliconFlowModelSelect
                model={settingsEdit.siliconCloudModel}
                siliconflowCustomModel={settingsEdit.openaiCustomModel}
                onChange={(model, siliconflowCustomModel) =>
                  setSettingsEdit({ ...settingsEdit, siliconCloudModel: model, openaiCustomModel: siliconflowCustomModel })
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
