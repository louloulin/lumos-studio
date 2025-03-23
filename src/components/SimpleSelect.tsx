import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export interface Props<T extends string | number> {
    label: string | React.ReactNode
    value: T
    options: { value: T; label: React.ReactNode }[]
    onChange: (value: T) => void
    className?: string
    fullWidth?: boolean
    size?: 'small' | 'medium'
    style?: React.CSSProperties
}

export default function SimpleSelect<T extends string | number>(props: Props<T>) {
    const { fullWidth = true, size, style } = props
    return (
        <div className={cn(
            "flex flex-col gap-1.5",
            fullWidth && "w-full",
            props.className
        )} style={style}>
            {props.label && <Label>{props.label}</Label>}
            <Select value={props.value.toString()} onValueChange={(value) => props.onChange(value as unknown as T)}>
                <SelectTrigger className={cn(
                    size === 'small' ? "h-8 text-sm" : "h-10"
                )}>
                    <SelectValue placeholder="选择选项" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {props.options.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
