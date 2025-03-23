import { Settings } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import * as defaults from '@/shared/defaults'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function ChatSettingTab(props: {
    settingsEdit: Settings
    setSettingsEdit: (settings: Settings) => void
}) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Textarea
                    placeholder={String(t('Default Prompt for New Conversation'))}
                    className="resize-none"
                    value={settingsEdit.defaultPrompt || ''}
                    rows={4}
                    onChange={(e) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            defaultPrompt: e.target.value,
                        })
                    }
                />
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs opacity-50"
                    onClick={() => {
                        setSettingsEdit({
                            ...settingsEdit,
                            defaultPrompt: defaults.getDefaultPrompt(),
                        })
                    }}
                >
                    {t('Reset to Default')}
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="auto-generate-title" className="cursor-pointer">
                        {t('Auto-Generate Chat Titles')}
                    </Label>
                    <Switch
                        id="auto-generate-title"
                        checked={settingsEdit.autoGenerateTitle}
                        onCheckedChange={(checked) => {
                            setSettingsEdit({
                                ...settingsEdit,
                                autoGenerateTitle: checked,
                            })
                        }}
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <Label htmlFor="spell-check" className="cursor-pointer">
                        {t('Spell Check')}
                    </Label>
                    <Switch
                        id="spell-check"
                        checked={settingsEdit.spellCheck}
                        onCheckedChange={(checked) => {
                            setSettingsEdit({
                                ...settingsEdit,
                                spellCheck: checked,
                            })
                        }}
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <Label htmlFor="markdown-rendering" className="cursor-pointer">
                        {t('Markdown Rendering')}
                    </Label>
                    <Switch
                        id="markdown-rendering"
                        checked={settingsEdit.enableMarkdownRendering}
                        onCheckedChange={(checked) => {
                            settingsEdit.enableMarkdownRendering = checked
                            setSettingsEdit({ ...settingsEdit })
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
