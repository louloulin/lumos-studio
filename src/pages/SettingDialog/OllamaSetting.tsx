import { Alert, AlertDescription } from '@/components/ui/alert'
import { ModelSettings } from '@/shared/types'
import { Trans, useTranslation } from 'react-i18next'
import TextFieldReset from '@/components/TextFieldReset'
import { useEffect, useState } from 'react'
import Ollama from '@/packages/models/ollama'
import platform from '@/packages/platform'
import { useAtomValue } from 'jotai'
import { languageAtom } from '@/stores/atoms'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function OllamaHostInput(props: {
    ollamaHost: string
    setOllamaHost: (host: string) => void
    className?: string
}) {
    const { t } = useTranslation()
    const language = useAtomValue(languageAtom)
    return (
        <>
            <TextFieldReset
                label={t('api host') as string}
                value={props.ollamaHost}
                defaultValue='http://localhost:11434'
                onValueChange={props.setOllamaHost}
                fullWidth
                className={props.className}
            />
            {
                props.ollamaHost
                && props.ollamaHost.length > 16
                && !props.ollamaHost.includes('localhost')
                && !props.ollamaHost.includes('127.0.0.1') && (
                    <Alert className='my-4'>
                        <AlertDescription>
                            <Trans i18nKey='Please ensure that the Remote Ollama Service is able to connect remotely. For more details, refer to <a>this tutorial</a>.'
                                components={{
                                    a: <a className='cursor-pointer font-bold' onClick={() => {
                                        platform.openLink(`https://chatboxai.app/redirect_app/ollama_guide/${language}`)
                                    }}></a>,
                                }}
                            />
                        </AlertDescription>
                    </Alert>
                )
            }
        </>
    )
}

export function OllamaModelSelect(props: {
    ollamaModel: ModelSettings['ollamaModel']
    setOlamaModel: (model: ModelSettings['ollamaModel']) => void
    ollamaHost: string
    className?: string
}) {
    const { t } = useTranslation()
    const [models, setModels] = useState<string[]>([])
    useEffect(() => {
        const model = new Ollama({
            ollamaHost: props.ollamaHost,
            ollamaModel: props.ollamaModel,
            temperature: 0.5,
        })
        model.listModels().then((models) => {
            setModels(models)
        })
        if (props.ollamaModel && models.length > 0 && !models.includes(props.ollamaModel)) {
            props.setOlamaModel(models[0])
        }
    }, [props.ollamaHost])
    return (
        <div className={props.className}>
            <Label htmlFor="ollama-model-select">{t('model')}</Label>
            <Select
                value={props.ollamaModel}
                onValueChange={props.setOlamaModel}
            >
                <SelectTrigger id="ollama-model-select" className="w-full mt-1">
                    <SelectValue placeholder={t('Select a model')} />
                </SelectTrigger>
                <SelectContent>
                    {models.map((model) => (
                        <SelectItem key={model} value={model}>
                            {model}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
