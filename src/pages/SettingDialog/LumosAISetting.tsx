import React, { useState } from 'react'
import { LumosAILicenseDetail, ModelSettings } from '@/shared/types'
import { Trans, useTranslation } from 'react-i18next'
import PasswordTextField from '@/components/PasswordTextField'
import LumosAIModelSelect from '@/components/LumosAIModelSelect'
import * as remote from '@/packages/remote'
import platform from '@/packages/platform'
import { trackingEvent } from '@/packages/event'
import * as premiumActions from '@/stores/premiumActions'
import { useAtomValue } from 'jotai'
import { languageAtom } from '@/stores/atoms'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { 
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

// 简化的许可证详情接口，与API返回匹配
interface SimpleLicenseDetail {
    name: string
    plan: string
    tokenLeft: number
    tokenTotal: number
    expireAt?: string
    status: string
}

export default function LumosAISetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const activated = premiumActions.useAutoValidate()
    const [loading, setLoading] = useState(false)
    const [tip, setTip] = useState<React.ReactNode | null>(null)
    const language = useAtomValue(languageAtom)

    const onInputChange = (value: string) => {
        setLoading(false)
        setTip(null)
        setSettingsEdit({ ...settingsEdit, licenseKey: value })
    }

    const activate = async () => {
        setLoading(true)
        try {
            const result = await premiumActions.activate(settingsEdit.licenseKey || '')
            if (!result.valid) {
                switch (result.error) {
                    case 'reached_activation_limit':
                        setTip(
                            <div className="text-red-500">
                                <Trans i18nKey="This license key has reached the activation limit, <a>click here</a> to manage license and devices to deactivate old devices."
                                    components={{ 
                                        a: <a href={`https://lumosai.app/redirect_app/manage_license/${language}`}
                                             target='_blank' 
                                             rel='noreferrer'
                                             className="font-medium underline" /> 
                                    }}
                                />
                            </div>
                        )
                        break;
                    case 'not_found':
                        setTip(
                            <div className="text-red-500">
                                {t('License not found, please check your license key')}
                            </div>
                        )
                        break;
                    case 'expired':
                        setTip(
                            <div className="text-red-500">
                                {t('License expired, please check your license key')}
                            </div>
                        )
                        break;
                }
            }
        } catch (e) {
            setTip(
                <div className="text-red-500">
                    {t('Failed to activate license, please check your license key and network connection')}
                    <br />
                    {(e as any).message}
                </div>
            )
        }
        setLoading(false)
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <PasswordTextField
                    label={t('Lumos AI License')}
                    value={settingsEdit.licenseKey || ''}
                    setValue={onInputChange}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                    disabled={activated}
                />
                <div className="flex items-center space-x-2 mb-4">
                    {activated && (
                        <>
                            <span className="text-green-700 text-xs">{t('License Activated')}</span>
                            <Button variant="ghost" size="sm" onClick={() => {
                                premiumActions.deactivate()
                                trackingEvent('click_deactivate_license_button', { event_category: 'user' })
                            }}>
                                {t('clean')}({t('Deactivate')})
                            </Button>
                        </>
                    )}
                    {!activated && (
                        <Button 
                            variant={settingsEdit.licenseKey ? "default" : "ghost"} 
                            size="sm"
                            onClick={activate}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('Activating...')}
                                </>
                            ) : (
                                t('Activate License')
                            )}
                        </Button>
                    )}
                </div>
                {tip && <div className="mt-2">{tip}</div>}
                {activated && (
                    <LumosAIModelSelect
                        value={settingsEdit.lumosAIModel}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, lumosAIModel: v })}
                    />
                )}
                <DetailCard licenseKey={settingsEdit.licenseKey} activated={activated} />
            </div>
        </div>
    )
}

function DetailCard(props: { licenseKey?: string, activated?: boolean }) {
    const { licenseKey, activated } = props
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [detail, setDetail] = useState<SimpleLicenseDetail | null>(null)

    const fetchDetail = async () => {
        if (!licenseKey) {
            return
        }
        setLoading(true)
        try {
            const licenseDetail = await remote.getLicenseDetail({ licenseKey })
            if (licenseDetail) {
                // 转换API返回的许可证详情为简化格式
                setDetail({
                    name: licenseDetail.name,
                    plan: licenseDetail.name, // 使用name作为plan
                    tokenLeft: Math.round(licenseDetail.remaining_quota_35 * 100),
                    tokenTotal: 100,
                    expireAt: licenseDetail.token_expire_time || undefined,
                    status: 'active'
                })
            }
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    React.useEffect(() => {
        fetchDetail()
    }, [licenseKey, activated])

    if (!activated) {
        return null
    }

    return (
        <Card className="mt-4">
            <CardContent className="p-4">
                <div className="mb-3 flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6">
                        {t('License Detail')}
                    </h3>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchDetail} 
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            t('refresh')
                        )}
                    </Button>
                </div>
                
                {loading && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                
                {!loading && detail && (
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t('Plan')}</span>
                            <span className="text-sm font-medium">{detail.plan}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t('Status')}</span>
                            <span className="text-sm font-medium flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                {t('Active')}
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t('Expire At')}</span>
                            <span className="text-sm font-medium">
                                {detail.expireAt ? new Date(detail.expireAt).toLocaleDateString() : t('Never')}
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {t('Token')} ({detail.tokenLeft}/{detail.tokenTotal})
                                </span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-xs text-blue-600 cursor-help">
                                                {t('What is this?')}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs">
                                                {t('This is the percentage of your monthly token quota remaining.')}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Progress value={detail.tokenLeft} />
                        </div>
                        
                        <div className="pt-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => platform.openLink(`https://lumosai.app/redirect_app/manage_license/${language}`)}
                            >
                                {t('Manage License')}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}