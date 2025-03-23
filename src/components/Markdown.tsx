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
            className={`break-words ${className || ''}`}
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
                    />
                ),
            }}
        >
            { children }
        </ReactMarkdown>
    ), [children])
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
                    className={className}
                    style={{
                        backgroundColor: isDarkMode ? '#333' : '#f1f1f1',
                        padding: '2px 4px',
                        marigin: '0 4px',
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
            <div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        backgroundColor: 'rgb(50, 50, 50)',
                        fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        borderTopLeftRadius: '0.3rem',
                        borderTopRightRadius: '0.3rem',
                        borderBottomLeftRadius: '0',
                        borderBottomRightRadius: '0',
                    }}
                >
                    <span
                        style={{
                            textDecoration: 'none',
                            color: 'gray',
                            padding: '2px',
                            margin: '2px 10px 0 10px',
                        }}
                    >
                        {'<' + language.toUpperCase() + '>'}
                    </span>
                    {
                        !hiddenCodeCopyButton && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 mx-2 my-1 hover:bg-[rgb(80,80,80)] opacity-50 hover:opacity-100"
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
                <SyntaxHighlighter
                    children={String(children).replace(/\n$/, '')}
                    style={isDarkMode ? atomDark : a11yDark}
                    language={language}
                    PreTag="div"
                    customStyle={{
                        marginTop: '0',
                        margin: '0',
                        borderTopLeftRadius: '0',
                        borderTopRightRadius: '0',
                        borderBottomLeftRadius: '0.3rem',
                        borderBottomRightRadius: '0.3rem',
                        border: 'none',
                    }}
                />
            </div>
        )
    }, [props.children, isDarkMode])
}
