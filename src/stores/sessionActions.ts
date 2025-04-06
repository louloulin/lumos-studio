import { getDefaultStore } from 'jotai'
import {
    Settings,
    createMessage,
    Message,
    Session,
} from '@/shared/types'
import * as atoms from './atoms'
import * as promptFormat from '@/packages/prompts'
import * as Sentry from '@sentry/react'
import { v4 as uuidv4 } from 'uuid'
import * as defaults from '@/shared/defaults'
import * as scrollActions from './scrollActions'
import { getModel, getModelDisplayName } from '@/packages/models'
import { AIProviderNoImplementedPaintError, NetworkError, ApiError, BaseError, LumosAIAPIError } from '@/packages/models/errors'
import platform from '@/packages/platform'
import { throttle } from 'lodash'
import { countWord } from '@/packages/word-count'
import { estimateTokensFromMessages } from '@/packages/token'
import * as Storage from '../services/storage'
import * as MastraAPI from '../api/mastra'

export function create(newSession: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => [...sessions, newSession])
    switchCurrentSession(newSession.id)
}

export function modify(update: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === update.id) {
                return update
            }
            return s
        })
    )
}

export function modifyName(sessionId: string, name: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return { ...s, name, threadName: name }
            }
            return s
        })
    )
}

export function createEmpty(type: 'chat') {
    switch (type) {
        case 'chat':
            return create(initEmptyChatSession())
        default:
            throw new Error(`Unknown session type: ${type}`)
    }
}

export function switchCurrentSession(sessionId: string) {
    const store = getDefaultStore()
    store.set(atoms.currentSessionIdAtom, sessionId)
    scrollActions.scrollToBottom()
}

export function remove(session: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => sessions.filter((s) => s.id !== session.id))
}

export function clear(sessionId: string) {
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    modify({
        ...session,
        messages: session.messages.filter((m) => m.role === 'system'),
    })
}

export async function copy(source: Session) {
    const store = getDefaultStore()
    const newSession = { ...source }
    newSession.id = uuidv4()
    store.set(atoms.sessionsAtom, (sessions) => {
        let originIndex = sessions.findIndex((s) => s.id === source.id)
        if (originIndex < 0) {
            originIndex = 0
        }
        const newSessions = [...sessions]
        newSessions.splice(originIndex + 1, 0, newSession)
        return newSessions
    })
}

export function getSession(sessionId: string): Session | null {
    const store = getDefaultStore()
    const sessions = store.get(atoms.sessionsAtom)
    return sessions.find((s) => s.id === sessionId) || null
}

export function insertMessage(sessionId: string, msg: Message) {
    const store = getDefaultStore()
    msg.wordCount = countWord(msg.content)
    msg.tokenCount = estimateTokensFromMessages([msg])
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                const newMessages = [...s.messages]
                newMessages.push(msg)
                return {
                    ...s,
                    messages: newMessages,
                }
            }
            return s
        })
    )
}

export function modifyMessage(sessionId: string, updated: Message, refreshCounting?: boolean) {
    const store = getDefaultStore()
    if (refreshCounting) {
        updated.wordCount = countWord(updated.content)
        updated.tokenCount = estimateTokensFromMessages([updated])
    }

    updated.timestamp = new Date().getTime()

    let hasHandled = false
    const handle = (msgs: Message[]) => {
        return msgs.map((m) => {
            if (m.id === updated.id) {
                hasHandled = true
                return { ...updated }
            }
            return m
        })
    }
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id !== sessionId) {
                return s
            }
            s.messages = handle(s.messages)
            return { ...s }
        })
    )
}

export async function submitNewUserMessage(params: {
    currentSessionId: string
    newUserMsg: Message
    needGenerating: boolean
}) {
    const { currentSessionId, newUserMsg, needGenerating } = params
    insertMessage(currentSessionId, newUserMsg)
    let newAssistantMsg = createMessage('assistant', '')
    if (needGenerating) {
        newAssistantMsg.generating = true
        insertMessage(currentSessionId, newAssistantMsg)
    }
    if (needGenerating) {
        return generate(currentSessionId, newAssistantMsg)
    }
}

export async function generate(sessionId: string, targetMsg: Message) {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const configs = await platform.getConfig()
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    
    const placeholder = '...'
    targetMsg = {
        ...targetMsg,
        content: placeholder,
        cancel: undefined,
        aiProvider: settings.aiProvider,
        model: getModelDisplayName(settings, session.type || 'chat'),
        generating: true,
        errorCode: undefined,
        error: undefined,
        errorExtra: undefined,
    }
    modifyMessage(sessionId, targetMsg)

    let messages = session.messages
    let targetMsgIx = messages.findIndex((m) => m.id === targetMsg.id)

    try {
        const model = getModel(settings, configs)
        switch (session.type) {
            case 'chat':
            case undefined:
                const promptMsgs = genMessageContext(settings, messages.slice(0, targetMsgIx))
                const throttledModifyMessage = throttle(({ text, cancel }: { text: string, cancel: () => void }) => {
                    targetMsg = { ...targetMsg, content: text, cancel }
                    modifyMessage(sessionId, targetMsg)
                }, 100)
                await model.chat(promptMsgs, throttledModifyMessage)
                targetMsg = {
                    ...targetMsg,
                    generating: false,
                    cancel: undefined,
                    tokensUsed: estimateTokensFromMessages([...promptMsgs, targetMsg]),
                }
                modifyMessage(sessionId, targetMsg, true)
                break
            default:
                throw new Error(`Unknown session type: ${session.type}, generate failed`)
        }
    } catch (err: any) {
        if (!(err instanceof Error)) {
            err = new Error(`${err}`)
        }
        if (!(err instanceof ApiError || err instanceof NetworkError || err instanceof AIProviderNoImplementedPaintError)) {
            Sentry.captureException(err) // unexpected error should be reported
        }
        let errorCode: number | undefined = undefined
        if (err instanceof BaseError) {
            errorCode = err.code
        }
        targetMsg = {
            ...targetMsg,
            generating: false,
            cancel: undefined,
            content: targetMsg.content === placeholder ? '' : targetMsg.content,
            errorCode,
            error: `${err.message}`,
            errorExtra: {
                aiProvider: settings.aiProvider,
                host: err['host'],
            },
        }
        modifyMessage(sessionId, targetMsg, true)
    }
}

async function _generateName(sessionId: string, modifyName: (sessionId: string, name: string) => void) {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    const configs = await platform.getConfig()
    try {
        const model = getModel(settings, configs)
        let name = await model.chat(promptFormat.nameConversation(
            session.messages
                .filter(m => m.role !== 'system')
                .slice(0, 4),
            settings.language,
        ),
        )
        name = name.replace(/['"“"']/g, '')
        name = name.slice(0, 10)
        modifyName(session.id, name)
    } catch (e: any) {
        if (!(e instanceof ApiError || e instanceof NetworkError)) {
            Sentry.captureException(e) // unexpected error should be reported
        }
    }
}

export async function generateName(sessionId: string) {
    return _generateName(sessionId, modifyName)
}

function genMessageContext(settings: Settings, msgs: Message[]) {
    const {
        openaiMaxContextMessageCount
    } = settings
    if (msgs.length === 0) {
        throw new Error('No messages to replay')
    }
    const head = msgs[0].role === 'system' ? msgs[0] : undefined
    if (head) {
        msgs = msgs.slice(1)
    }
    let totalLen = head ? estimateTokensFromMessages([head]) : 0
    let prompts: Message[] = []
    for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i]
        if (msg.error || msg.errorCode) {
            continue
        }
        const size = estimateTokensFromMessages([msg]) + 20 // 20 is a rough estimation of the overhead of the prompt
        if (settings.aiProvider === 'openai') {
        }
        if (
            openaiMaxContextMessageCount <= 20 &&
            prompts.length >= openaiMaxContextMessageCount + 1
        ) {
            break
        }
        prompts = [msg, ...prompts]
        totalLen += size
    }
    if (head) {
        prompts = [head, ...prompts]
    }
    return prompts
}

export function initEmptyChatSession(): Session {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    return {
        id: uuidv4(),
        name: 'Untitled',
        type: 'chat',
        messages: [
            {
                id: uuidv4(),
                role: 'system',
                content: settings.defaultPrompt || defaults.getDefaultPrompt(),
            },
        ],
    }
}

export function getSessions() {
    const store = getDefaultStore()
    return store.get(atoms.sessionsAtom)
}

export function getSortedSessions() {
    const store = getDefaultStore()
    return store.get(atoms.sortedSessionsAtom)
}

export function getCurrentSession() {
    const store = getDefaultStore()
    return store.get(atoms.currentSessionAtom)
}

export function getCurrentMessages() {
    const store = getDefaultStore()
    return store.get(atoms.currentMessageListAtom)
}

export function createSession(agentId: string, title: string = '新会话'): Session {
    const store = getDefaultStore()
    const newSession: Session = {
        id: uuidv4(),
        title,
        defaultAgentId: agentId,
        agentIds: [agentId],
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        agentContexts: {},
    }
    
    store.set(atoms.sessionsAtom, (sessions) => [...sessions, newSession])
    setActiveSession(newSession.id)
    Storage.saveSession(newSession)
    
    return newSession
}

export function createMultiAgentSession(agentIds: string[], title: string = '多智能体对话'): Session {
    if (!agentIds.length) {
        throw new Error('至少需要一个智能体')
    }
    
    const store = getDefaultStore()
    const newSession: Session = {
        id: uuidv4(),
        title,
        defaultAgentId: agentIds[0],
        agentIds: [...agentIds],
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        agentContexts: {},
    }
    
    store.set(atoms.sessionsAtom, (sessions) => [...sessions, newSession])
    setActiveSession(newSession.id)
    Storage.saveSession(newSession)
    
    return newSession
}

export function setActiveSession(sessionId: string) {
    const store = getDefaultStore()
    store.set(atoms.currentSessionIdAtom, sessionId)
    Storage.setActiveSessionId(sessionId)
}

export function updateSessionTitle(sessionId: string, title: string): void {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    title,
                    updatedAt: Date.now(),
                }
            }
            return s
        })
    )
    
    const updatedSession = getSession(sessionId)
    if (updatedSession) {
        Storage.saveSession(updatedSession)
    }
}

export function addMessage(sessionId: string, message: Omit<Message, 'id' | 'createdAt'>): Message {
    const store = getDefaultStore()
    const newMessage: Message = {
        ...message,
        id: uuidv4(),
        createdAt: Date.now(),
    }
    
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: [...s.messages, newMessage],
                    updatedAt: Date.now(),
                }
            }
            return s
        })
    )
    
    const updatedSession = getSession(sessionId)
    if (updatedSession) {
        Storage.saveSession(updatedSession)
    }
    
    return newMessage
}

export function updateMessage(sessionId: string, messageId: string, updatedMessage: Partial<Message>) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: s.messages.map((m) =>
                        m.id === messageId ? { ...m, ...updatedMessage } : m
                    ),
                    updatedAt: Date.now(),
                }
            }
            return s
        })
    )
    
    const updatedSession = getSession(sessionId)
    if (updatedSession) {
        Storage.saveSession(updatedSession)
    }
}

export function addAgentToSession(sessionId: string, agentId: string): void {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                if (!s.agentIds.includes(agentId)) {
                    return {
                        ...s,
                        agentIds: [...s.agentIds, agentId],
                        updatedAt: Date.now(),
                    }
                }
            }
            return s
        })
    )
    
    const updatedSession = getSession(sessionId)
    if (updatedSession) {
        Storage.saveSession(updatedSession)
    }
}

export function removeAgentFromSession(sessionId: string, agentId: string): void {
    const store = getDefaultStore()
    const session = getSession(sessionId)
    
    if (session && session.defaultAgentId === agentId) {
        console.warn('Cannot remove default agent from session')
        return
    }
    
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    agentIds: s.agentIds.filter(id => id !== agentId),
                    updatedAt: Date.now(),
                }
            }
            return s
        })
    )
    
    const updatedSession = getSession(sessionId)
    if (updatedSession) {
        Storage.saveSession(updatedSession)
    }
}

export function setSessionDefaultAgent(sessionId: string, agentId: string): void {
    const store = getDefaultStore()
    const session = getSession(sessionId)
    
    if (session && !session.agentIds.includes(agentId)) {
        addAgentToSession(sessionId, agentId)
    }
    
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    defaultAgentId: agentId,
                    updatedAt: Date.now(),
                }
            }
            return s
        })
    )
    
    const updatedSession = getSession(sessionId)
    if (updatedSession) {
        Storage.saveSession(updatedSession)
    }
}

export function setAgentSystemPrompt(sessionId: string, agentId: string, prompt: string): void {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    agentContexts: {
                        ...s.agentContexts,
                        [agentId]: {
                            ...s.agentContexts?.[agentId],
                            systemPrompt: prompt,
                        },
                    },
                    updatedAt: Date.now(),
                }
            }
            return s
        })
    )
    
    const updatedSession = getSession(sessionId)
    if (updatedSession) {
        Storage.saveSession(updatedSession)
    }
}

export function setAgentModelSettings(sessionId: string, agentId: string, settings: any): void {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    agentContexts: {
                        ...s.agentContexts,
                        [agentId]: {
                            ...s.agentContexts?.[agentId],
                            modelSettings: settings,
                        },
                    },
                    updatedAt: Date.now(),
                }
            }
            return s
        })
    )
    
    const updatedSession = getSession(sessionId)
    if (updatedSession) {
        Storage.saveSession(updatedSession)
    }
}

export function deleteSession(sessionId: string): void {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => 
        sessions.filter(s => s.id !== sessionId)
    )
    Storage.deleteSession(sessionId)
}

export function clearSessionMessages(sessionId: string): void {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: [],
                    updatedAt: Date.now(),
                }
            }
            return s
        })
    )
    
    const updatedSession = getSession(sessionId)
    if (updatedSession) {
        Storage.saveSession(updatedSession)
    }
}

/**
 * 获取特定会话中的特定消息
 * @param sessionId 会话ID
 * @param messageId 消息ID
 * @returns 消息对象，如果找不到则返回undefined
 */
export function getMessage(sessionId: string, messageId: string) {
    const session = getSession(sessionId);
    if (!session) return undefined;
    
    return session.messages.find(m => m.id === messageId);
}
