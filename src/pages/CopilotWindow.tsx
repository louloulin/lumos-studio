import React, { useState, useEffect } from 'react'
import { CopilotDetail, Message } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { useMyCopilots, useRemoteCopilots } from '@/hooks/useCopilots'
import * as remote from '@/packages/remote'
import { v4 as uuidv4 } from 'uuid'
import * as atoms from '@/stores/atoms'
import * as sessionActions from '@/stores/sessionActions'
import { useAtomValue } from 'jotai'
import platform from '@/packages/platform'
import { trackingEvent } from '@/packages/event'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Lucide Icons
import { PlusCircle, Star, StarOff, Edit, Trash2, MoreHorizontal } from 'lucide-react'

interface Props {
    open: boolean
    close(): void
}

export default function CopilotWindow(props: Props) {
    const language = useAtomValue(atoms.languageAtom)

    const { t } = useTranslation()

    const store = useMyCopilots()
    const remoteStore = useRemoteCopilots(language, props.open)

    const createChatSessionWithCopilot = (copilot: CopilotDetail) => {
        const msgs: Message[] = []
        msgs.push({ id: uuidv4(), role: 'system', content: copilot.prompt })
        if (copilot.demoQuestion) {
            msgs.push({
                id: uuidv4(),
                role: 'user',
                content: copilot.demoQuestion,
            })
        }
        if (copilot.demoAnswer) {
            msgs.push({
                id: uuidv4(),
                role: 'assistant',
                content: copilot.demoAnswer,
            })
        }
        sessionActions.create({
            id: uuidv4(),
            name: copilot.name,
            type: 'chat',
            picUrl: copilot.picUrl,
            messages: msgs,
            copilotId: copilot.id,
        })
        trackingEvent('create_copilot_conversation', { event_category: 'user' })
    }

    const useCopilot = (detail: CopilotDetail) => {
        const newDetail = { ...detail, usedCount: (detail.usedCount || 0) + 1 }
        if (newDetail.shared) {
            remote.recordCopilotShare(newDetail)
        }
        store.addOrUpdate(newDetail)
        createChatSessionWithCopilot(newDetail)
        props.close()
    }

    const [copilotEdit, setCopilotEdit] = useState<CopilotDetail | null>(null)
    useEffect(() => {
        if (!props.open) {
            setCopilotEdit(null)
        } else {
            trackingEvent('copilot_window', { event_category: 'screen_view' })
        }
    }, [props.open])

    const list = [
        ...store.copilots.filter((item) => item.starred).sort((a, b) => b.usedCount - a.usedCount),
        ...store.copilots.filter((item) => !item.starred).sort((a, b) => b.usedCount - a.usedCount),
    ]

    return (
        <Dialog open={props.open} onOpenChange={(open) => !open && props.close()}>
            <DialogContent className="sm:max-w-4xl h-4/5">
                <DialogHeader>
                    <DialogTitle>{t('My Copilots')}</DialogTitle>
                </DialogHeader>
                
                {copilotEdit ? (
                    <CopilotForm
                        copilotDetail={copilotEdit}
                        close={() => {
                            setCopilotEdit(null)
                        }}
                        save={(detail) => {
                            store.addOrUpdate(detail)
                            setCopilotEdit(null)
                        }}
                    />
                ) : (
                    <Button
                        variant="outline"
                        onClick={() => {
                            getEmptyCopilot().then(setCopilotEdit)
                        }}
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        {t('Create New Copilot')}
                    </Button>
                )}
                
                <Tabs defaultValue="my" className="w-full">
                    <TabsList>
                        <TabsTrigger value="my">{t('My Copilots')}</TabsTrigger>
                        <TabsTrigger value="featured">{t('Chatbox Featured')}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="my">
                        <div className="flex flex-wrap w-full gap-2 overflow-y-auto overflow-x-hidden">
                            {list.map((item, ix) => (
                                <MiniItem
                                    key={`${item.id}_${ix}`}
                                    mode="local"
                                    detail={item}
                                    useMe={() => useCopilot(item)}
                                    switchStarred={() => {
                                        store.addOrUpdate({
                                            ...item,
                                            starred: !item.starred,
                                        })
                                    }}
                                    editMe={() => {
                                        setCopilotEdit(item)
                                    }}
                                    deleteMe={() => {
                                        store.remove(item.id)
                                    }}
                                />
                            ))}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="featured">
                        <div className="flex flex-wrap w-full gap-2 overflow-y-auto overflow-x-hidden">
                            {remoteStore.copilots.map((item, ix) => (
                                <MiniItem key={`${item.id}_${ix}`} mode="remote" detail={item} useMe={() => useCopilot(item)} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
                
                <DialogFooter>
                    <Button onClick={props.close}>{t('close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

type MiniItemProps =
    | {
        mode: 'local'
        detail: CopilotDetail
        useMe(): void
        switchStarred(): void
        editMe(): void
        deleteMe(): void
    }
    | {
        mode: 'remote'
        detail: CopilotDetail
        useMe(): void
    }

function MiniItem(props: MiniItemProps) {
    const { t } = useTranslation()
    
    const useCopilot = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault()
        props.useMe()
    }

    return (
        <div
            className={cn(
                "flex flex-row items-center p-2 m-1 cursor-pointer w-48",
                "hover:bg-secondary/25 border border-secondary/20 rounded-md"
            )}
            onClick={useCopilot}
        >
            <Avatar className="h-8 w-8">
                <AvatarImage src={props.detail.picUrl} />
                <AvatarFallback>{props.detail.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="ml-2 w-28">
                <p className="text-sm font-medium truncate">{props.detail.name}</p>
            </div>

            {props.mode === 'local' && (
                <div className="ml-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                {props.detail.starred ? 
                                    <Star className="h-4 w-4 text-primary" /> : 
                                    <MoreHorizontal className="h-4 w-4" />
                                }
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={props.switchStarred}>
                                {props.detail.starred ? (
                                    <>
                                        <StarOff className="h-4 w-4 mr-2" />
                                        {t('unstar')}
                                    </>
                                ) : (
                                    <>
                                        <Star className="h-4 w-4 mr-2" />
                                        {t('star')}
                                    </>
                                )}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={props.editMe}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('edit')}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                                onClick={props.deleteMe}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    )
}

interface CopilotFormProps {
    copilotDetail: CopilotDetail
    close(): void
    save(copilotDetail: CopilotDetail): void
}

function CopilotForm(props: CopilotFormProps) {
    const { t } = useTranslation()
    const [copilotEdit, setCopilotEdit] = useState<CopilotDetail>({ ...props.copilotDetail })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const inputHandler = (field: keyof CopilotDetail) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCopilotEdit({ ...copilotEdit, [field]: e.target.value })
    }

    const save = () => {
        const newErrors: Record<string, string> = {}
        if (!copilotEdit.name) {
            newErrors.name = t('Please input copilot name')
        }
        if (!copilotEdit.prompt) {
            newErrors.prompt = t('Please input copilot prompt')
        }
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
            return
        }
        props.save(copilotEdit)
    }

    return (
        <div className="mb-5 bg-muted p-4 rounded-md">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">{t('Copilot Name')}</Label>
                    <Input 
                        id="name"
                        placeholder={t('My Assistant') as string}
                        value={copilotEdit.name}
                        onChange={inputHandler('name')}
                    />
                    {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="prompt">{t('Copilot Prompt')}</Label>
                    <Textarea 
                        id="prompt"
                        placeholder={t('Copilot Prompt Demo') as string}
                        rows={4}
                        value={copilotEdit.prompt}
                        onChange={inputHandler('prompt')}
                    />
                    {errors.prompt && <p className="text-destructive text-xs">{errors.prompt}</p>}
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="picUrl">{t('Copilot Avatar URL')}</Label>
                    <Input 
                        id="picUrl"
                        placeholder="http://xxxxx/xxx.png"
                        value={copilotEdit.picUrl}
                        onChange={inputHandler('picUrl')}
                    />
                </div>
                
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id="share" 
                            checked={copilotEdit.shared}
                            onCheckedChange={(checked: boolean) => setCopilotEdit({ ...copilotEdit, shared: checked })}
                        />
                        <Label htmlFor="share">{t('Share with Chatbox')}</Label>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={props.close}>
                            {t('cancel')}
                        </Button>
                        <Button onClick={save}>
                            {t('save')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export async function getEmptyCopilot(): Promise<CopilotDetail> {
    const conf = await platform.getConfig()
    return {
        id: `${conf.uuid}:${uuidv4()}`,
        name: '',
        picUrl: '',
        prompt: '',
        starred: false,
        usedCount: 0,
        shared: true,
    }
}
