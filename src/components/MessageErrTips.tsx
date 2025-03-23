import React from 'react'
import { Trans } from 'react-i18next'
import { Message } from '@/shared/types'
import { aiProviderNameHash } from '@/packages/models'
import * as atoms from '@/stores/atoms'
import * as settingActions from '@/stores/settingActions'
import { useSetAtom } from 'jotai'
import { ChatboxAIAPIError } from '@/packages/models/errors'
import platform from '@/packages/platform'
import { trackingEvent } from '@/packages/event'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export default function MessageErrTips(props: { msg: Message }) {
    const { msg } = props
    const setOpenSettingDialogAtom = useSetAtom(atoms.openSettingDialogAtom)
    if (!msg.error) {
        return null
    }
    const tips: React.ReactNode[] = []
    let onlyShowTips = false 
    if (msg.error.startsWith('API Error')) {
        tips.push(
            <Trans
                i18nKey="api error tips"
                values={{
                    aiProvider: msg.aiProvider ? aiProviderNameHash[msg.aiProvider] : 'AI Provider',
                }}
                components={[
                    <a
                        className="underline hover:text-primary"
                        href={`https://chatboxai.app/redirect_app/faqs/${settingActions.getLanguage()}`}
                        target="_blank"
                    ></a>,
                ]}
            />
        )
    } else if (msg.error.startsWith('Network Error')) {
        tips.push(
            <Trans
                i18nKey="network error tips"
                values={{
                    host: msg.errorExtra?.['host'] || 'AI Provider',
                }}
            />
        )
        const proxy = settingActions.getProxy()
        if (proxy) {
            tips.push(<Trans i18nKey="network proxy error tips" values={{ proxy }} />)
        }
    } else if (msg.errorCode === 10003) {
        tips.push(
            <Trans
                i18nKey="ai provider no implemented paint tips"
                values={{
                    aiProvider: msg.aiProvider ? aiProviderNameHash[msg.aiProvider] : 'AI Provider',
                }}
                components={[
                    <button 
                        className="cursor-pointer font-bold text-primary underline"
                        onClick={() => setOpenSettingDialogAtom('ai')}
                    ></button>,
                ]}
            />
        )
    } else if (msg.errorCode && ChatboxAIAPIError.getDetail(msg.errorCode)) {
        const chatboxAIErrorDetail = ChatboxAIAPIError.getDetail(msg.errorCode)
        if (chatboxAIErrorDetail) {
            onlyShowTips = true
            tips.push(
                <Trans
                    i18nKey={chatboxAIErrorDetail.i18nKey}
                    values={{
                        model: msg.model,
                    }}
                    components={{
                        OpenSettingButton: (
                            <button 
                                className="cursor-pointer italic text-primary underline"
                                onClick={() => setOpenSettingDialogAtom('ai')}
                            ></button>
                        ),
                        OpenMorePlanButton: (
                            <button 
                                className="cursor-pointer italic text-primary underline" 
                                onClick={() => {
                                    platform.openLink('https://chatboxai.app/redirect_app/view_more_plans')
                                    trackingEvent('click_view_more_plans_button_from_upgrade_error_tips', { event_category: 'user' })
                                }}
                            ></button>
                        )
                    }}
                />
            )
        }
    } else {
        tips.push(
            <Trans
                i18nKey="unknown error tips"
                components={[
                    <a
                        className="underline hover:text-primary"
                        href={`https://chatboxai.app/redirect_app/faqs/${settingActions.getLanguage()}`}
                        target="_blank"
                    ></a>,
                ]}
            />
        )
    }
    return (
        <Alert variant="destructive" className="mt-2 mb-4">
            <AlertDescription>
                <div className="font-semibold">
                    {tips.map((tip, i) => (<span key={i}>{tip}</span>))}
                </div>
                {
                    !onlyShowTips && (
                        <div className="mt-2 text-sm opacity-80">
                            {msg.error}
                        </div>
                    )
                }
            </AlertDescription>
        </Alert>
    )
}
