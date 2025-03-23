import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Slider } from '@/components/ui/slider'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertCircle, User, ChevronDown } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function ShadcnTest() {
    const { toast } = useToast()

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Shadcn/UI 组件测试</h1>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">按钮样式</h2>
                <div className="flex flex-wrap gap-2">
                    <Button variant="default">默认按钮</Button>
                    <Button variant="secondary">次要按钮</Button>
                    <Button variant="destructive">危险按钮</Button>
                    <Button variant="outline">轮廓按钮</Button>
                    <Button variant="ghost">幽灵按钮</Button>
                    <Button variant="link">链接按钮</Button>
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">头像</h2>
                <div className="flex gap-2">
                    <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar>
                        <AvatarFallback>
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">表单控件</h2>
                <div className="space-y-2 max-w-md">
                    <Input placeholder="输入框" />
                    
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="选择一个选项" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="option1">选项 1</SelectItem>
                            <SelectItem value="option2">选项 2</SelectItem>
                            <SelectItem value="option3">选项 3</SelectItem>
                        </SelectContent>
                    </Select>

                    <div>
                        <Slider defaultValue={[50]} max={100} step={1} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">通知与提示</h2>
                <div className="space-y-2">
                    <Button 
                        onClick={() => {
                            toast({
                                title: "通知标题",
                                description: "这是一个通知消息。",
                            })
                        }}
                    >
                        显示通知
                    </Button>

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>提示标题</AlertTitle>
                        <AlertDescription>
                            这是一个提示信息，用于显示重要内容。
                        </AlertDescription>
                    </Alert>
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">对话框</h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>打开对话框</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>对话框标题</DialogTitle>
                            <DialogDescription>
                                这是一个对话框的描述内容，用于提供额外信息。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">对话框的主要内容放在这里。</div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">手风琴与下拉菜单</h2>
                <div className="space-y-2">
                    <Accordion type="single" collapsible className="max-w-md">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>手风琴项目 1</AccordionTrigger>
                            <AccordionContent>
                                这是手风琴的内容区域，点击标题可以展开或收起。
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>手风琴项目 2</AccordionTrigger>
                            <AccordionContent>
                                您可以添加任何内容在这里，比如文本、图像或其他组件。
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-1">
                                下拉菜单 <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>菜单项 1</DropdownMenuItem>
                            <DropdownMenuItem>菜单项 2</DropdownMenuItem>
                            <DropdownMenuItem>菜单项 3</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
} 