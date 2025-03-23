import React from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export default function PasswordTextField(props: {
    label: string
    value: string
    setValue: (value: string) => void
    placeholder?: string
    disabled?: boolean
    helperText?: React.ReactNode
}) {
    const [showPassword, setShowPassword] = React.useState(false)
    const handleClickShowPassword = () => setShowPassword((show) => !show)
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
    }
    return (
        <div className="space-y-1.5 w-full">
            <Label htmlFor={`password-${props.label}`}>{props.label}</Label>
            <div className="relative">
                <Input
                    id={`password-${props.label}`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={props.placeholder}
                    disabled={props.disabled}
                    value={props.value}
                    onChange={(e) => props.setValue(e.target.value.trim())}
                    className={cn(
                        "pr-10",
                        props.disabled && "opacity-50 cursor-not-allowed"
                    )}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                >
                    {showPassword ? 
                        <EyeOff className="h-4 w-4" /> : 
                        <Eye className="h-4 w-4" />
                    }
                </Button>
            </div>
            {props.helperText && (
                <p className="text-xs text-muted-foreground">{props.helperText}</p>
            )}
        </div>
    )
}
