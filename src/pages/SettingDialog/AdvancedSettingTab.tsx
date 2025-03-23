import { Settings } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import TextFieldReset from '@/components/TextFieldReset'
import { useAtom } from 'jotai'
import * as atoms from '@/stores/atoms'
import storage, { StorageKey } from '../../storage'
import { useState, useRef } from 'react'
import platform from '@/packages/platform'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion'

interface Props {
    settingsEdit: Settings
    setSettingsEdit: (settings: Settings) => void
    onCancel: () => void
}

export default function AdvancedSettingTab(props: Props) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <div className="space-y-4">
            <Accordion type="single" collapsible>
                <AccordionItem value="network-proxy">
                    <AccordionTrigger className="text-base font-medium">
                        {String(t('Network Proxy'))}
                    </AccordionTrigger>
                    <AccordionContent>
                        <TextFieldReset
                            label={String(t('Proxy Address'))}
                            value={settingsEdit.proxy || ''}
                            onValueChange={(value) => {
                                setSettingsEdit({ ...settingsEdit, proxy: value.trim() })
                            }}
                            placeholder="socks5://127.0.0.1:6153"
                            fullWidth
                        />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            <Accordion type="single" collapsible>
                <AccordionItem value="backup-restore">
                    <AccordionTrigger className="text-base font-medium">
                        {String(t('Data Backup and Restore'))}
                    </AccordionTrigger>
                    <AccordionContent>
                        <ExportAndImport onCancel={props.onCancel} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            <Accordion type="single" collapsible>
                <AccordionItem value="error-reporting">
                    <AccordionTrigger className="text-base font-medium">
                        {String(t('Error Reporting'))}
                    </AccordionTrigger>
                    <AccordionContent>
                        <AnalyticsSetting />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}

export function AnalyticsSetting() {
    const { t } = useTranslation()
    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm opacity-70">
                    {t('Lumos respects your privacy and only uploads anonymous error data and events when necessary. You can change your preferences at any time in the settings.')}
                </p>
            </div>
            <div className="mt-2">
                <AllowReportingAndTrackingCheckbox />
            </div>
        </div>
    )
}

export function AllowReportingAndTrackingCheckbox(props: {
    className?: string
}) {
    const { t } = useTranslation()
    const [allowReportingAndTracking, setAllowReportingAndTracking] = useAtom(atoms.allowReportingAndTrackingAtom)
    
    // 创建一个处理函数，用于更新设置
    const handleSettingChange = (checked: boolean) => {
        // 修改settings的allowReportingAndTracking属性
        const settingUpdated = { 
            ...settings,
            allowReportingAndTracking: checked
        };
        // 更新设置
        settingsUpdate(settingUpdated);
    }
    
    // 使用settingsAtom来获取和更新设置
    const [settings, settingsUpdate] = useAtom(atoms.settingsAtom);
    
    return (
        <div className={`flex items-center space-x-2 ${props.className || ''}`}>
            <Checkbox
                id="allow-reporting"
                checked={allowReportingAndTracking}
                onCheckedChange={(checked) => {
                    if (checked === true || checked === false) {
                        handleSettingChange(checked);
                    }
                }}
            />
            <Label htmlFor="allow-reporting" className="cursor-pointer">
                {t('Enable optional anonymous reporting of crash and event data')}
            </Label>
        </div>
    )
}

enum ExportDataItem {
    Setting = 'setting',
    Conversations = 'conversations',
    Copilot = 'copilot',
}

function ExportAndImport(props: { onCancel: () => void }) {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<string>('export')
    const [exportItems, setExportItems] = useState<ExportDataItem[]>([
        ExportDataItem.Setting,
        ExportDataItem.Conversations,
        ExportDataItem.Copilot,
    ])
    const importInputRef = useRef<HTMLInputElement>(null)
    const [importTips, setImportTips] = useState('')
    
    const onExport = async () => {
        const data = await storage.getAll()
        delete data[StorageKey.Configs]
            ; (data[StorageKey.Settings] as Settings).licenseDetail = undefined
            ; (data[StorageKey.Settings] as Settings).licenseInstances = undefined
        if (!exportItems.includes(ExportDataItem.Setting)) {
            delete data[StorageKey.Settings]
        }
        if (!exportItems.includes(ExportDataItem.Conversations)) {
            delete data[StorageKey.ChatSessions]
        }
        if (!exportItems.includes(ExportDataItem.Copilot)) {
            delete data[StorageKey.MyCopilots]
        }
        const date = new Date()
        data['__exported_items'] = exportItems
        data['__exported_at'] = date.toISOString()
        const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
        platform.exporter.exportTextFile(`lumos-exported-data-${dateStr}.json`, JSON.stringify(data))
    }
    
    const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const errTip = t('Import failed, unsupported data format')
        const file = e.target.files?.[0]
        if (!file) {
            return
        }
        const reader = new FileReader()
        reader.onload = (event) => {
            ; (async () => {
                setImportTips('')
                try {
                    let result = event.target?.result
                    if (typeof result !== 'string') {
                        throw new Error('FileReader result is not string')
                    }
                    const json = JSON.parse(result)
                    await storage.setAll(json)
                    props.onCancel()
                    platform.relaunch()
                } catch (err) {
                    setImportTips(errTip)

                    throw err
                }
            })()
        }
        reader.onerror = (event) => {
            setImportTips(errTip)
            const err = event.target?.error
            if (!err) {
                throw new Error('FileReader error but no error message')
            }
            throw err
        }
        reader.readAsText(file)
    }
    
    return (
        <div className="p-4 bg-muted rounded-md">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="export">{t('Data Backup')}</TabsTrigger>
                    <TabsTrigger value="import">{t('Data Restore')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="export" className="space-y-4">
                    <div className="space-y-2">
                        {[
                            { label: t('Settings'), value: ExportDataItem.Setting },
                            { label: t('Chat History'), value: ExportDataItem.Conversations },
                            { label: t('My Copilots'), value: ExportDataItem.Copilot },
                        ].map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`export-${item.value}`}
                                    checked={exportItems.includes(item.value)}
                                    onCheckedChange={(checked: boolean | "indeterminate") => {
                                        if (checked === true && !exportItems.includes(item.value)) {
                                            setExportItems([...exportItems, item.value])
                                        } else if (checked === false) {
                                            setExportItems(exportItems.filter((v) => v !== item.value))
                                        }
                                    }}
                                />
                                <Label htmlFor={`export-${item.value}`} className="cursor-pointer">
                                    {item.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                    <Button onClick={onExport}>
                        {t('Export Selected Data')}
                    </Button>
                </TabsContent>
                
                <TabsContent value="import" className="space-y-4">
                    <div className="text-sm">
                        {t('Upon import, changes will take effect immediately and existing data will be overwritten')}
                    </div>
                    {importTips && <div className="text-destructive text-sm">{importTips}</div>}
                    <input style={{ display: 'none' }} type="file" ref={importInputRef} onChange={onImport} />
                    <Button onClick={() => importInputRef.current?.click()}>
                        {t('Import and Restore')}
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
    )
}
