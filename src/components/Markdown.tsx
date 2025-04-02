import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { a11yDark, atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import * as toastActions from '@/stores/toastActions'
import { sanitizeUrl } from '@braintree/sanitize-url'
import { useAtomValue } from 'jotai'
import { themeAtom } from '@/stores/atoms'
import { Theme } from '@/shared/types'
import { Copy } from 'lucide-react'
import { Button } from './ui/button'

import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you
import { copyToClipboard } from '@/packages/navigator'

export default function Markdown(props: {
    children: string
    hiddenCodeCopyButton?: boolean
    className?: string
}) {
    const { children, hiddenCodeCopyButton, className } = props
    return useMemo(() => (
        <ReactMarkdown
            remarkPlugins={
                [remarkGfm, remarkMath, remarkBreaks]
            }
            rehypePlugins={[rehypeKatex]}
            className={`break-words overflow-hidden ${className || ''}`}
            urlTransform={(url) => sanitizeUrl(url)}
            components={{
                code: (props: any) => CodeBlock({ ...props, hiddenCodeCopyButton }),
                a: ({ node, ...props }) => (
                    <a
                        {...props}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                            e.stopPropagation()
                        }}
                        className="text-primary underline hover:text-primary/80"
                    />
                ),
                pre: ({ node, ...props }) => (
                    <pre {...props} className="overflow-auto max-w-full my-2" />
                ),
                p: ({ node, ...props }) => (
                    <p {...props} className="my-2" />
                ),
                ul: ({ node, ...props }) => (
                    <ul {...props} className="list-disc pl-6 my-2" />
                ),
                ol: ({ node, ...props }) => (
                    <ol {...props} className="list-decimal pl-6 my-2" />
                ),
                li: ({ node, ...props }) => (
                    <li {...props} className="my-1" />
                ),
                blockquote: ({ node, ...props }) => (
                    <blockquote 
                      {...props} 
                      className="border-l-4 border-primary/30 pl-4 my-3 text-muted-foreground italic" 
                    />
                ),
                h1: ({ node, ...props }) => (
                    <h1 {...props} className="text-2xl font-bold my-3" />
                ),
                h2: ({ node, ...props }) => (
                    <h2 {...props} className="text-xl font-bold my-3" />
                ),
                h3: ({ node, ...props }) => (
                    <h3 {...props} className="text-lg font-bold my-2" />
                ),
                h4: ({ node, ...props }) => (
                    <h4 {...props} className="text-base font-bold my-2" />
                ),
                table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-3">
                        <table {...props} className="border-collapse border border-border w-full" />
                    </div>
                ),
                th: ({ node, ...props }) => (
                    <th {...props} className="border border-border bg-muted p-2 text-left" />
                ),
                td: ({ node, ...props }) => (
                    <td {...props} className="border border-border p-2" />
                ),
            }}
        >
            { children }
        </ReactMarkdown>
    ), [children, className, hiddenCodeCopyButton])
}

export function CodeBlock(props: any) {
    const { t } = useTranslation()
    // 使用jotai获取主题，替代MUI的useTheme
    const theme = useAtomValue(themeAtom)
    const isDarkMode = theme === Theme.DarkMode
    
    return useMemo(() => {
        const { children, className, node, hiddenCodeCopyButton, ...rest } = props
        const match = /language-(\w+)/.exec(className || '')
        const language = match?.[1] || 'text'
        if (!String(children).includes('\n')) {
            return (
                <code
                    {...rest}
                    className={`font-mono text-sm ${className}`}
                    style={{
                        backgroundColor: isDarkMode ? '#333' : '#f1f1f1',
                        padding: '2px 4px',
                        margin: '0 2px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: isDarkMode ? '#444' : '#ddd',
                    }}
                >
                    {children}
                </code>
            )
        }
        return (
            <div className="overflow-hidden rounded-md my-3 w-full">
                <div
                    className="flex justify-between items-center w-full bg-[rgb(45,45,45)] font-mono text-xs"
                    style={{
                        borderTopLeftRadius: '0.3rem',
                        borderTopRightRadius: '0.3rem',
                    }}
                >
                    <span
                        className="text-gray-400 px-3 py-1.5"
                    >
                        {language.toUpperCase()}
                    </span>
                    {
                        !hiddenCodeCopyButton && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 mx-2 my-1 hover:bg-[rgb(80,80,80)] opacity-70 hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    copyToClipboard(String(children))
                                    toastActions.add(t('copied to clipboard'))
                                }}
                            >
                                <Copy className="h-4 w-4 text-white" />
                                <span className="sr-only">Copy code</span>
                            </Button>
                        )
                    }
                </div>
                <div className="w-full overflow-x-auto" style={{ maxHeight: '400px' }}>
                    <SyntaxHighlighter
                        children={String(children).replace(/\n$/, '')}
                        style={isDarkMode ? atomDark : a11yDark}
                        language={language}
                        PreTag="div"
                        customStyle={{
                            margin: 0,
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            borderBottomLeftRadius: '0.3rem',
                            borderBottomRightRadius: '0.3rem',
                            border: 'none',
                            fontSize: '0.9rem',
                            maxWidth: '100%',
                            padding: '1rem',
                        }}
                        showLineNumbers={true}
                        wrapLines={true}
                        wrapLongLines={false}
                    />
                </div>
            </div>
        )
    }, [props.children, isDarkMode, t, props.hiddenCodeCopyButton])
}
