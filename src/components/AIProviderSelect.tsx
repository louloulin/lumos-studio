import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ModelSettings } from '@/shared/types'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AIModelProviderMenuOptionList } from '@/packages/models'

interface ModelConfigProps {
    settings: ModelSettings
    setSettings(value: ModelSettings): void
    className?: string
    hideCustomProviderManage?: boolean
}

export default function AIProviderSelect(props: ModelConfigProps) {
    const { settings, setSettings, className, hideCustomProviderManage } = props
    const { t } = useTranslation()
    const [open, setOpen] = React.useState(false)

    const selectedProvider = AIModelProviderMenuOptionList.find(
        (provider) => provider.value === settings.aiProvider
    )

    return (
        <div className={cn("space-y-1", className)}>
            <div className="text-xs text-muted-foreground">
                {t('Model Provider')}:
            </div>
            <div className="flex items-center justify-between">
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="default" 
                            className="w-full justify-between text-left font-normal"
                        >
                            <span className="truncate max-w-[200px]">
                                {selectedProvider?.label || 'Unknown'}
                            </span>
                            {selectedProvider?.featured && (
                                <Badge variant="secondary" className="ml-2">
                                    {t('Featured')}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[200px]">
                        <DropdownMenuLabel>{t('Model Provider')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {AIModelProviderMenuOptionList.map((item) => (
                            <DropdownMenuItem
                                key={item.value}
                                disabled={item.disabled}
                                onClick={() => {
                                    setSettings({
                                        ...settings,
                                        aiProvider: item.value,
                                    })
                                    setOpen(false)
                                }}
                                className="flex items-center justify-between"
                            >
                                <span>{item.label}</span>
                                {item.featured && (
                                    <Badge variant="secondary" className="ml-2">
                                        {t('Featured')}
                                    </Badge>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

