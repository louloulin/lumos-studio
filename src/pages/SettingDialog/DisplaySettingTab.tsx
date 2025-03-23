import { Settings, Theme } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { languageNameMap, languages } from '@/i18n/locales'
import SimpleSelect from '@/components/SimpleSelect'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Languages } from "lucide-react"

export default function DisplaySettingTab(props: {
    settingsEdit: Settings
    setSettingsEdit: (settings: Settings) => void
    changeModeWithPreview: (newMode: Theme) => void
}) {
    const { settingsEdit, setSettingsEdit, changeModeWithPreview } = props
    const { t } = useTranslation()
    return (
        <div className="space-y-6">
            <SimpleSelect
                label={(
                    <span className="inline-flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        {t('language')}
                    </span>
                )}
                value={settingsEdit.language}
                onChange={(language) => setSettingsEdit({ ...settingsEdit, language: language })}
                options={languages.map((language) => ({ value: language, label: languageNameMap[language] }))}
            />
            <SimpleSelect
                label={t('Font Size')}
                value={settingsEdit.fontSize}
                onChange={(fontSize) => setSettingsEdit({ ...settingsEdit, fontSize: fontSize })}
                options={[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((size) => ({ value: size, label: size }))}
            />
            <SimpleSelect
                label={t('theme')}
                value={settingsEdit.theme}
                onChange={(theme) => changeModeWithPreview(theme)}
                options={[
                    { value: Theme.FollowSystem, label: t('Follow System') },
                    { value: Theme.LightMode, label: t('Light Mode') },
                    { value: Theme.DarkMode, label: t('Dark Mode') },
                ]}
            />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-word-count" className="cursor-pointer">
                        {t('show message word count')}
                    </Label>
                    <Switch
                        id="show-word-count"
                        checked={settingsEdit.showWordCount}
                        onCheckedChange={(checked) =>
                            setSettingsEdit({
                                ...settingsEdit,
                                showWordCount: checked,
                            })
                        }
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-token-count" className="cursor-pointer">
                        {t('show message token count')}
                    </Label>
                    <Switch
                        id="show-token-count"
                        checked={settingsEdit.showTokenCount}
                        onCheckedChange={(checked) =>
                            setSettingsEdit({
                                ...settingsEdit,
                                showTokenCount: checked,
                            })
                        }
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-token-used" className="cursor-pointer">
                        {t('show message token usage')}
                    </Label>
                    <Switch
                        id="show-token-used"
                        checked={settingsEdit.showTokenUsed}
                        onCheckedChange={(checked) =>
                            setSettingsEdit({
                                ...settingsEdit,
                                showTokenUsed: checked,
                            })
                        }
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-model-name" className="cursor-pointer">
                        {t('show model name')}
                    </Label>
                    <Switch
                        id="show-model-name"
                        checked={settingsEdit.showModelName}
                        onCheckedChange={(checked) =>
                            setSettingsEdit({
                                ...settingsEdit,
                                showModelName: checked,
                            })
                        }
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-message-timestamp" className="cursor-pointer">
                        {t('show message timestamp')}
                    </Label>
                    <Switch
                        id="show-message-timestamp"
                        checked={settingsEdit.showMessageTimestamp}
                        onCheckedChange={(checked) =>
                            setSettingsEdit({
                                ...settingsEdit,
                                showMessageTimestamp: checked,
                            })
                        }
                    />
                </div>
            </div>
        </div>
    )
}
