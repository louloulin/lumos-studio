import React from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TextFieldResetProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue' | 'value' | 'onChange'> {
    defaultValue?: string
    value: string
    onValueChange: (value: string) => void
    label?: string
    variant?: string
    fullWidth?: boolean
    helperText?: React.ReactNode
    multiline?: boolean
}

export default function TextFieldReset(props: TextFieldResetProps) {
    const { t } = useTranslation()
    const { defaultValue = '', label, variant, fullWidth, helperText, multiline, className, ...rest } = props
    const handleReset = () => props.onValueChange(defaultValue)
    const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
    }
    
    return (
        <div className={cn("relative w-full", fullWidth && "w-full", className)}>
            {label && <div className="text-sm mb-1">{label}</div>}
            <div className="flex">
                <Input
                    {...rest}
                    value={props.value}
                    onChange={(e) => props.onValueChange(e.target.value)}
                    className={cn(
                        defaultValue !== props.value && "pr-16"
                    )}
                />
                {defaultValue !== props.value && (
                    <Button 
                        type="button"
                        variant="ghost" 
                        onClick={handleReset} 
                        onMouseDown={handleMouseDown}
                        className="absolute right-0"
                        size="sm"
                    >
                        {t('reset')}
                    </Button>
                )}
            </div>
            {helperText && <div className="text-xs text-muted-foreground mt-1">{helperText}</div>}
        </div>
    )
}
