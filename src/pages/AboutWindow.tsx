import { useTranslation } from 'react-i18next'
import iconPNG from '@/static/icon.png'
import platform from '@/packages/platform'
import useVersion from '@/hooks/useVersion'
import * as atoms from '@/stores/atoms'
import { useAtomValue } from 'jotai'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from '@/components/ui/badge'

interface Props {
    open: boolean
    close(): void
}

export default function AboutWindow(props: Props) {
    const { t } = useTranslation()
    const language = useAtomValue(atoms.languageAtom)
    const versionHook = useVersion()
    
    return (
        <Dialog open={props.open} onOpenChange={(open) => !open && props.close()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('About Chatbox')}</DialogTitle>
                </DialogHeader>
                
                <div className="text-center px-5">
                    <img src={iconPNG} className="w-24 inline-block" />
                    <h3 className="m-1">
                        Chatbox
                        {/\d/.test(versionHook.version) ? `(v${versionHook.version})` : ''}
                    </h3>
                    <p className="p-0 m-0">{t('about-slogan')}</p>
                    <p className="p-0 m-0 opacity-60 text-xs">{t('about-introduction')}</p>
                </div>
                
                <div className="flex justify-center items-center flex-wrap mt-1">
                    <div className="relative m-1">
                        {versionHook.needCheckUpdate && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => platform.openLink(`https://chatboxai.app/redirect_app/check_update/${language}`)}
                        >
                            {t('Check Update')}
                        </Button>
                    </div>
                    
                    <Button
                        variant="outline"
                        className="m-1"
                        onClick={() => platform.openLink(`https://chatboxai.app/redirect_app/homepage/${language}`)}
                    >
                        {t('Homepage')}
                    </Button>
                    
                    <Button
                        variant="outline"
                        className="m-1"
                        onClick={() => platform.openLink(`https://chatboxai.app/redirect_app/feedback/${language}`)}
                    >
                        {t('Feedback')}
                    </Button>
                    
                    <Button
                        variant="outline"
                        className="m-1"
                        onClick={() => platform.openLink(`https://chatboxai.app/redirect_app/faqs/${language}`)}
                    >
                        {t('FAQs')}
                    </Button>
                </div>
                
                <div className="border rounded-md text-xs p-4 my-2 bg-card">
                    <div className="my-1">
                        <b>Benn:</b>
                    </div>
                    <div className="my-1">
                        <span>{t('Auther Message')}</span>
                    </div>
                    <div className="my-1">
                        <a
                            className="underline font-normal cursor-pointer mr-4 text-primary"
                            onClick={() => platform.openLink(`https://chatboxai.app/redirect_app/donate/${language}`)}
                        >
                            {t('Donate')}
                        </a>
                        <a
                            className="underline font-normal cursor-pointer mr-4 text-primary"
                            onClick={() => platform.openLink(`https://chatboxai.app/redirect_app/author/${language}`)}
                        >
                            {t('Follow me on Twitter(X)')}
                        </a>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button onClick={props.close}>{t('close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
