import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Message } from '@/shared/types'
import { aiProviderNameHash } from '@/packages/models'
import * as atoms from '@/stores/atoms'
import * as settingActions from '@/stores/settingActions'
import { useSetAtom } from 'jotai'
import { LumosAIAPIError } from '@/packages/models/errors'
import platform from '@/packages/platform'
import { trackingEvent } from '@/packages/event'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export default function MessageErrTips(props: { msg: Message }) {
    const { msg } = props
    const setOpenDialog = useSetAtom(atoms.openDialogAtom)
    const setSetting = useSetAtom(atoms.settingsAtom)
    const [onlyShowTips, setOnlyShowTips] = React.useState(false)
    const tips: React.ReactNode[] = []
    
    React.useEffect(() => {
        if (msg.errorCode) {
            setOnlyShowTips(true)
        }
    }, [msg.errorCode])
    
    const openSettingDialog = () => {
        setOpenDialog('setting')
        settingActions.setTab('ai')(setSetting)
    }
    
    let content: React.ReactNode = null
    
    if (!msg.error) {
        // pass
    } else if (msg.error.includes('network error') || msg.error.includes('Failed to fetch') || msg.error.includes('Network Error')) {
        if (msg.aiProvider) {
            const host = aiProviderNameHash[msg.aiProvider]
            content = (
                <Trans i18nKey="network error tips"
                    values={{ host }}
                />
            )
        }
    } else if (msg.error.includes('proxy')) {
        const proxy = msg.error.match(/proxy\s*=\s*([^\s,]+)/)?.[1] || ''
        content = (
            <Trans i18nKey="network proxy error tips"
                values={{ proxy }}
            />
        )
    } else if (msg.error.includes('api error')) {
        content = (
            <Trans i18nKey="api error tips"
                values={{ aiProvider: msg.aiProvider }}
                components={{
                    0: <a
                        className='underline cursor-pointer'
                        onClick={() => {
                            platform.openLink('https://lumosai.app/redirect_app/faqs/en')
                        }}
                    />,
                }}
            />
        )
    } else if (msg.errorCode) {
        content = (
            <Trans
                i18nKey={msg.error}
                values={{
                    model: msg.model,
                }}
                components={{
                    OpenSettingButton: <a
                        className='underline cursor-pointer'
                        onClick={() => {
                            openSettingDialog()
                        }}
                    />,
                    OpenMorePlanButton: <a
                        className='underline cursor-pointer'
                        onClick={() => {
                            window.open('https://lumosai.app/pricing?ref=app', '_blank')
                        }}
                    />,
                }}
            />
        )
    } else {
        content = (
            <Trans i18nKey="unknown error tips"
                components={{
                    0: <a
                        className='underline cursor-pointer'
                        onClick={() => {
                            trackingEvent('open_faq')
                            platform.openLink('https://lumosai.app/redirect_app/faqs/en')
                        }}
                    />,
                }}
            />
        )
    }
    
    if (content) {
        tips.push(React.cloneElement(content as React.ReactElement, { key: 'error-tip' }))
    }
    
    return tips.length === 0 ? null : (
        <Alert variant="destructive" className={cn("mb-4 dark:text-red-400 text-red-700", onlyShowTips && 'bg-transparent border-transparent')}>
            <AlertDescription>
                {tips}
            </AlertDescription>
        </Alert>
    )
}
