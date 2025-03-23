import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'

export interface Props {
    value: number
    onChange(value: number): void
    className?: string
}

export default function MaxContextMessageCountSlider(props: Props) {
    const { t } = useTranslation()
    
    return (
        <div className={cn("my-6 px-3", props.className)}>
            <div className="mb-2">
                <h4 className="text-sm font-medium">{t('Max Message Count in Context')}</h4>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <Slider
                        value={[props.value]}
                        onValueChange={(values) => {
                            const v = values[0]
                            props.onChange(v)
                        }}
                        step={2}
                        min={0}
                        max={22}
                        className="py-4"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0</span>
                        <span>10</span>
                        <span>{t('No Limit')}</span>
                    </div>
                </div>
                
                <Input
                    value={props.value > 20 ? t('No Limit').toString() : props.value.toString()}
                    onChange={(event) => {
                        const s = event.target.value.trim()
                        const v = parseInt(s)
                        if (isNaN(v)) {
                            return
                        }
                        props.onChange(v)
                    }}
                    type="text"
                    className="w-24"
                />
            </div>
        </div>
    )
}
