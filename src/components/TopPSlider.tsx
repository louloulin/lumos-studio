import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'

export interface Props {
    topP: number
    setTopP: (topP: number) => void
    className?: string
}

export default function TopPSlider(props: Props) {
    const { t } = useTranslation()
    const [input, setInput] = useState('1')
    
    useEffect(() => {
        setInput(`${props.topP}`)
    }, [props.topP])
    
    const handleChange = (_: any, newValue: number | number[]) => {
        if (typeof newValue === 'number') {
            props.setTopP(newValue)
        } else if (Array.isArray(newValue)) {
            props.setTopP(newValue[0])
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
            setInput(`${props.topP}`)
            return
        }
        if (num < 0 || num > 1) {
            setInput(`${props.topP}`)
            return
        }
        // only keep 2 decimal places
        num = Math.round(num * 100) / 100
        setInput(num.toString())
        props.setTopP(num)
    }
    
    return (
        <div className={cn("my-6 px-3", props.className)}>
            <div className="mb-2">
                <h4 className="text-sm font-medium">{t('Top P')}</h4>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <Slider
                        value={[props.topP]}
                        onValueChange={(values) => handleChange(null, values)}
                        step={0.01}
                        min={0}
                        max={1}
                        className="py-4"
                    />
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
