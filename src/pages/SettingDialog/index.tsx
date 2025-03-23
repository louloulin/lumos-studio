import React, { useEffect } from 'react'
import { Settings, SettingWindowTab, Theme } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/stores/atoms'
import { switchTheme } from '@/hooks/useAppTheme'
import ChatSettingTab from './ChatSettingTab'
import DisplaySettingTab from './DisplaySettingTab'
import ModelSettingTab from './ModelSettingTab'
import AdvancedSettingTab from './AdvancedSettingTab'
import { trackingEvent } from '@/packages/event'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, MonitorSpeaker, MessageSquare, Settings as SettingsIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
    open: boolean
    targetTab?: SettingWindowTab
    close(): void
}

export default function SettingWindow(props: Props) {
    const { t } = useTranslation()
    const [settings, setSettings] = useAtom(settingsAtom)

    // 标签页控制
    const [currentTab, setCurrentTab] = React.useState<SettingWindowTab>('ai')
    useEffect(() => {
        if (props.targetTab) {
            setCurrentTab(props.targetTab)
        }
    }, [props.targetTab, props.open])
    useEffect(() => {
        if (props.open) {
            trackingEvent('setting_window', { event_category: 'screen_view' })
        }
    }, [props.open])

    const [settingsEdit, _setSettingsEdit] = React.useState<Settings>(settings)
    const setSettingsEdit = (updated: Settings) => {
        _setSettingsEdit(updated)
    }

    useEffect(() => {
        _setSettingsEdit(settings)
    }, [settings])

    const onSave = () => {
        setSettings(settingsEdit)
        props.close()
    }

    const onCancel = () => {
        props.close()
        setSettingsEdit(settings)
        // need to restore the previous theme
        switchTheme(settings.theme ?? Theme.FollowSystem)
    }

    const changeThemeWithPreview = (newMode: Theme) => {
        setSettingsEdit({ ...settingsEdit, theme: newMode })
        switchTheme(newMode)
    }

    return (
        <Dialog open={props.open} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t('settings')}</DialogTitle>
                </DialogHeader>

                <Tabs 
                    value={currentTab} 
                    onValueChange={(value) => setCurrentTab(value as SettingWindowTab)} 
                    className="mt-4"
                >
                    <TabsList className="w-full mb-4 border-b">
                        <TabsTrigger value="ai" className="flex items-center gap-1.5">
                            <Bot className="h-4 w-4" />
                            <span>{t('model')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="display" className="flex items-center gap-1.5">
                            <MonitorSpeaker className="h-4 w-4" />
                            <span>{t('display')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            <span>{t('chat')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="advanced" className="flex items-center gap-1.5">
                            <SettingsIcon className="h-4 w-4" />
                            <span>{t('advanced')}</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ai">
                        <ModelSettingTab
                            settingsEdit={settingsEdit}
                            setSettingsEdit={(updated) => {
                                setSettingsEdit({ ...settingsEdit, ...updated })
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="display">
                        <DisplaySettingTab
                            settingsEdit={settingsEdit}
                            setSettingsEdit={(updated) => {
                                setSettingsEdit({ ...settingsEdit, ...updated })
                            }}
                            changeModeWithPreview={changeThemeWithPreview}
                        />
                    </TabsContent>

                    <TabsContent value="chat">
                        <ChatSettingTab
                            settingsEdit={settingsEdit}
                            setSettingsEdit={(updated) => {
                                setSettingsEdit({ ...settingsEdit, ...updated })
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="advanced">
                        <AdvancedSettingTab
                            settingsEdit={settingsEdit}
                            setSettingsEdit={(updated) => {
                                setSettingsEdit({ ...settingsEdit, ...updated })
                            }}
                            onCancel={onCancel}
                        />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onCancel}>{t('cancel')}</Button>
                    <Button onClick={onSave}>{t('save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
