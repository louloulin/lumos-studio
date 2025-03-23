import React, { useEffect, useState } from 'react';
import { ModelSettings } from '@/shared/types';
import { Trans, useTranslation } from 'react-i18next';
import TextFieldReset from '@/components/TextFieldReset';
import LMStudio from '@/packages/models/lmstudio';
import platform from '@/packages/platform';
import { useAtomValue } from 'jotai';
import { languageAtom } from '@/stores/atoms';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function LMStudioHostInput(props: {
    LMStudioHost: string
    setLMStudioHost: (host: string) => void
    className?: string
}) {
    const { t } = useTranslation();
    const language = useAtomValue(languageAtom);
    return (
        <div className={props.className}>
            <TextFieldReset
                label={t('api host')}
                value={props.LMStudioHost}
                defaultValue='http://localhost:1234'
                onValueChange={props.setLMStudioHost}
                fullWidth
            />
            {
                props.LMStudioHost
                && props.LMStudioHost.length > 16
                && !props.LMStudioHost.includes('localhost')
                && !props.LMStudioHost.includes('127.0.0.1') && (
                    <Alert variant="default" className="mt-4">
                        <AlertDescription>
                            <Trans i18nKey='Please ensure that the Remote LM Studio Service is able to connect remotely. For more details, refer to <a>this tutorial</a>.'
                                components={{
                                    a: <a className='cursor-pointer font-bold' onClick={() => {
                                        platform.openLink(`https://chatboxai.app/redirect_app/lm_studio_guide/${language}`)
                                    }}></a>
                                }}
                            />
                        </AlertDescription>
                    </Alert>
                )
            }
        </div>
    );
}

export function LMStudioModelSelect(props: {
    LMStudioModel: ModelSettings['lmStudioModel']
    setLMStudioModel: (model: ModelSettings['lmStudioModel']) => void
    LMStudioHost: string
    className?: string
}) {
    const { t } = useTranslation();
    const [models, setModels] = useState<string[]>([]);
    
    useEffect(() => {
        const model = new LMStudio({
            lmStudioHost: props.LMStudioHost,
            lmStudioModel: props.LMStudioModel,
            temperature: 0.5
        });
        model.listModels().then((models) => {
            setModels(models);
        });
        if (props.LMStudioModel && models.length > 0 && !models.includes(props.LMStudioModel)) {
            props.setLMStudioModel(models[0]);
        }
    }, [props.LMStudioHost]);
    
    return (
        <div className={`space-y-2 ${props.className || ''}`}>
            <Label htmlFor="lmstudio-model-select">{t('model')}</Label>
            <Select
                value={props.LMStudioModel}
                onValueChange={props.setLMStudioModel}
            >
                <SelectTrigger id="lmstudio-model-select">
                    <SelectValue placeholder={t('selectAModel')} />
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
    );
}
