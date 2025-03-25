import { ModelProvider, ModelSettings } from '@/shared/types'
import OpenAISetting from './OpenAISetting'
import LumosAISetting from './LumosAISetting'
import AIProviderSelect from '@/components/AIProviderSelect'
import { OllamaHostInput, OllamaModelSelect } from './OllamaSetting'
import { LMStudioHostInput, LMStudioModelSelect } from './LMStudioSetting'
import SiliconFlowSetting from './SiliconFlowSetting'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import TemperatureSlider from '@/components/TemperatureSlider'
import ClaudeSetting from './ClaudeSetting'
import PPIOSetting from './PPIOSetting'
import MastraSetting from './MastraSetting'
import { Separator } from "@/components/ui/separator"

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ModelSettingTab(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    return (
        <div className="space-y-6">
            <AIProviderSelect
                settings={settingsEdit}
                setSettings={setSettingsEdit}
            />
            <Separator className="my-4" />
            {settingsEdit.aiProvider === ModelProvider.OpenAI && (
                <OpenAISetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.LumosAI && (
                <LumosAISetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.Ollama && (
                <div className="space-y-4">
                    <OllamaHostInput
                        ollamaHost={settingsEdit.ollamaHost}
                        setOllamaHost={(v) => setSettingsEdit({ ...settingsEdit, ollamaHost: v })}
                    />
                    <OllamaModelSelect
                        ollamaModel={settingsEdit.ollamaModel}
                        setOlamaModel={(v) => setSettingsEdit({ ...settingsEdit, ollamaModel: v })}
                        ollamaHost={settingsEdit.ollamaHost}
                    />
                    <MaxContextMessageCountSlider
                        value={settingsEdit.openaiMaxContextMessageCount}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, openaiMaxContextMessageCount: v })}
                    />
                    <TemperatureSlider
                        value={settingsEdit.temperature}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, temperature: v })}
                    />
                </div>
            )}

            {settingsEdit.aiProvider === ModelProvider.LMStudio && (
                <div className="space-y-4">
                    <LMStudioHostInput
                        LMStudioHost={settingsEdit.lmStudioHost}
                        setLMStudioHost={(v) => setSettingsEdit({ ...settingsEdit, lmStudioHost: v })}
                    />
                    <LMStudioModelSelect
                        LMStudioModel={settingsEdit.lmStudioModel}
                        setLMStudioModel={(v) => setSettingsEdit({ ...settingsEdit, lmStudioModel: v })}
                        LMStudioHost={settingsEdit.lmStudioHost}
                    />
                    <MaxContextMessageCountSlider
                        value={settingsEdit.openaiMaxContextMessageCount}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, openaiMaxContextMessageCount: v })}
                    />
                    <TemperatureSlider
                        value={settingsEdit.temperature}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, temperature: v })}
                    />
                </div>
            )}


             {settingsEdit.aiProvider === ModelProvider.SiliconFlow && (
                <SiliconFlowSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.Claude && (
                <ClaudeSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.PPIO && (
                <PPIOSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.Mastra && (
                <MastraSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
        </div>
    )
}
