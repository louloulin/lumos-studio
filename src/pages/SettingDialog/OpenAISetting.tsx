import { ModelSettings, OpenAIModelType } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import TemperatureSlider from '@/components/TemperatureSlider'
import TopPSlider from '@/components/TopPSlider'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import OpenAIModelSelect from '@/components/OpenAIModelSelect'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { useState, useEffect } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function OpenAISetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const [showPassword, setShowPassword] = useState(false)
    const [openAIModelType, setOpenAIModelType] = useState<string>(() => {
      if (settingsEdit.model === 'gpt-3.5-turbo') {
        return OpenAIModelType.GPT3_5;
      } else if (settingsEdit.model === 'gpt-4') {
        return OpenAIModelType.GPT4;
      } else if (settingsEdit.model === 'gpt-4-turbo-preview') {
        return OpenAIModelType.GPT4_TURBO;
      } else if (settingsEdit.model === 'gpt-4-vision-preview') {
        return OpenAIModelType.GPT4_VISION;
      } else if (settingsEdit.model === 'custom-model') {
        return OpenAIModelType.CUSTOM;
      }
      return OpenAIModelType.GPT3_5;
    });

    const handleModelChange = (model: string) => {
      setOpenAIModelType(model);
      if (model === OpenAIModelType.CUSTOM) {
        setSettingsEdit({ 
          ...settingsEdit, 
          model: 'custom-model',
          openaiCustomModel: settingsEdit.openaiCustomModel || ''
        });
      } else {
        setSettingsEdit({ 
          ...settingsEdit, 
          model: model as any
        });
      }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="openai-api-key">{t('api key')}</Label>
                <div className="relative">
                    <Input
                        id="openai-api-key"
                        type={showPassword ? "text" : "password"}
                        value={settingsEdit.openaiKey}
                        onChange={(e) => {
                            setSettingsEdit({ ...settingsEdit, openaiKey: e.target.value })
                        }}
                        placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
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
                <Label htmlFor="api-host">{t('api host')}</Label>
                <div className="flex">
                    <Input
                        id="api-host"
                        type="text"
                        value={settingsEdit.apiHost}
                        placeholder="https://api.openai.com"
                        onChange={(e) => {
                            let value = e.target.value.trim()
                            if (value.length > 4 && !value.startsWith('http')) {
                                value = 'https://' + value
                            }
                            setSettingsEdit({ ...settingsEdit, apiHost: value })
                        }}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="ml-2"
                        onClick={() => {
                            setSettingsEdit({ ...settingsEdit, apiHost: 'https://api.openai.com' })
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
                            <OpenAIModelSelect
                                modelType={openAIModelType as OpenAIModelType}
                                onModelChange={handleModelChange}
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
    )
}
