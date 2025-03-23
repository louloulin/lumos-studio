import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export interface Props {
    value: number
    onChange(value: number): void
    className?: string
}

export default function TemperatureSlider(props: Props) {
    const { t } = useTranslation()
    const [input, setInput] = useState('0.70')
    
    useEffect(() => {
        setInput(`${props.value}`)
    }, [props.value])
    
    const handleTemperatureChange = (_: any, newValue: number | number[]) => {
        if (typeof newValue === 'number') {
            props.onChange(newValue)
        } else if (Array.isArray(newValue)) {
            props.onChange(newValue[0])
        }
    }
    
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        if (value === '' || value.endsWith('.')) {
            setInput(value)
            return
        }
        let num = parseFloat(value)
        if (isNaN(num)) {
            setInput(`${value}`)
            return
        }
        if (num < 0 || num > 1) {
            setInput(`${value}`)
            return
        }
        num = Math.round(num * 100) / 100 // only keep 2 decimal places
        setInput(num.toString())
        props.onChange(num)
    }
    
    return (
        <div className={cn("my-6 px-3", props.className)}>
            <div className="mb-2">
                <h4 className="text-sm font-medium">{t('temperature')}</h4>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Slider
                        value={[props.value]}
                        onValueChange={(values) => handleTemperatureChange(null, values)}
                        step={0.01}
                        min={0}
                        max={2}
                        className="py-4"
                    />
                    
                    <div className="flex justify-between px-1 mt-1 text-xs text-muted-foreground">
                        <div className="relative -left-2">
                            <Badge variant="outline" className="font-normal">
                                {t('meticulous')}
                            </Badge>
                        </div>
                        <div className="relative -right-2">
                            <Badge variant="outline" className="font-normal">
                                {t('creative')}
                            </Badge>
                        </div>
                    </div>
                </div>
                
                <Input
                    value={input}
                    onChange={handleInputChange}
                    type="text"
                    className="w-20"
                />
            </div>
        </div>
    )
}
