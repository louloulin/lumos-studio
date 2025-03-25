import React from 'react'
import { useTranslation } from 'react-i18next'
import platform from '@/packages/platform'
import { useAtomValue } from 'jotai'
import { languageAtom } from '@/stores/atoms'
import * as remote from '@/packages/remote'
import { ABOUT_DIALOG_VERSION } from '@/shared/defaults'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    ArrowUpCircle,
    Smartphone,
    Globe,
    MessageSquare,
    Heart,
    HelpCircle,
    User,
    CheckCircle2
} from "lucide-react"

interface Props {
    open: boolean
    close(): void
}

export default function AboutWindow(props: Props) {
    const { t } = useTranslation()
    const language = useAtomValue(languageAtom)
    return (
        <Dialog open={props.open} onOpenChange={(isOpen) => !isOpen && props.close()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('About Lumos')}</DialogTitle>
                </DialogHeader>
                
                <div className="pt-4 text-center">
                    <h1 className="text-4xl font-bold">Lumos</h1>
                    <p className="text-sm text-muted-foreground">
                        Version {ABOUT_DIALOG_VERSION}
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center h-20 space-y-2"
                        onClick={() => platform.openLink(`https://lumosai.app/redirect_app/check_update/${language}`)}
                    >
                        <ArrowUpCircle className="h-5 w-5" />
                        <span className="text-xs">{t('Check Update')}</span>
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center h-20 space-y-2"
                        onClick={() => platform.openLink(`https://lumosai.app/redirect_app/homepage/${language}`)}
                    >
                        <Globe className="h-5 w-5" />
                        <span className="text-xs">{t('Website')}</span>
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center h-20 space-y-2"
                        onClick={() => platform.openLink(`https://lumosai.app/redirect_app/feedback/${language}`)}
                    >
                        <MessageSquare className="h-5 w-5" />
                        <span className="text-xs">{t('Feedback')}</span>
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center h-20 space-y-2"
                        onClick={() => platform.openLink(`https://lumosai.app/redirect_app/faqs/${language}`)}
                    >
                        <HelpCircle className="h-5 w-5" />
                        <span className="text-xs">{t('FAQs')}</span>
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center h-20 space-y-2 col-span-2"
                        onClick={() => platform.openLink(`https://lumosai.app/redirect_app/donate/${language}`)}
                    >
                        <Heart className="h-5 w-5" />
                        <span className="text-xs">{t('Donate')}</span>
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center h-20 space-y-2 col-span-2"
                        onClick={() => platform.openLink(`https://lumosai.app/redirect_app/author/${language}`)}
                    >
                        <User className="h-5 w-5" />
                        <span className="text-xs">{t('Author')}</span>
                    </Button>
                </div>
                
                <DialogFooter>
                    <Button onClick={props.close}>
                        {t('close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
