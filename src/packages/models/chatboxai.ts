import { LumosAILicenseDetail, LumosAIModel, Message, MessageRole } from '@/shared/types'
import Base, { onResultChange } from './base'
import { API_ORIGIN } from '@/packages/remote'
import { BaseError, ApiError, NetworkError, LumosAIAPIError } from './errors'
import { parseJsonOrEmpty } from '@/lib/utils'

export const lumosAIModels: LumosAIModel[] = ['lumosai-3.5', 'lumosai-4']

interface Options {
    licenseKey?: string
    lumosAIModel?: LumosAIModel
    licenseInstances?: {
        [key: string]: string
    }
    licenseDetail?: LumosAILicenseDetail
    language: string
    temperature: number
}

interface Config {
    uuid: string
}

export default class LumosAI extends Base {
    public name = 'LumosAI'

    public options: Options
    public config: Config
    constructor(options: Options, config: Config) {
        super()
        this.options = options
        this.config = config
    }

    async callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        const messages = await populateLumosAIMessage(rawMessages)
        const response = await this.post(
            `${API_ORIGIN}/api/ai/chat`,
            this.getHeaders(),
            {
                uuid: this.config.uuid,
                model: this.options.lumosAIModel || 'lumosai-3.5',
                messages,
                temperature: this.options.temperature,
                language: this.options.language,
                stream: true,
            },
            signal
        )
        let result = ''
        await this.handleSSE(response, (message) => {
            if (message === '[DONE]') {
                return
            }
            const data = JSON.parse(message)
            if (data.error) {
                throw new ApiError(`Error from Lumos AI: ${JSON.stringify(data)}`)
            }
            const word = data.choices[0]?.delta?.content
            if (word !== undefined) {
                result += word
                if (onResultChange) {
                    onResultChange(result)
                }
            }
        })
        return result
    }

    getHeaders() {
        const license = this.options.licenseKey || ''
        const instanceId = (this.options.licenseInstances ? this.options.licenseInstances[license] : '') || ''
        const headers: Record<string, string> = {
            Authorization: license,
            'Instance-Id': instanceId,
            'Content-Type': 'application/json',
        }
        return headers
    }

    async post(
        url: string,
        headers: Record<string, string>,
        body: Record<string, any>,
        signal?: AbortSignal,
        retry = 3
    ) {
        let requestError: ApiError | NetworkError | null = null
        for (let i = 0; i < retry + 1; i++) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal,
                })
                if (!res.ok) {
                    const response = await res.text().catch((e) => '')
                    const errorCodeName = parseJsonOrEmpty(response)?.error?.code
                    const lumosAIError = LumosAIAPIError.fromCodeName(response, errorCodeName)
                    if (lumosAIError) {
                        throw lumosAIError
                    }
                    throw new ApiError(`Status Code ${res.status}, ${response}`)
                }
                return res
            } catch (e) {
                if (e instanceof BaseError) {
                    requestError = e
                } else {
                    const err = e as Error
                    const origin = new URL(url).origin
                    requestError = new NetworkError(err.message, origin)
                }
                await new Promise((resolve) => setTimeout(resolve, 500))
            }
        }
        if (requestError) {
            throw requestError
        } else {
            throw new Error('Unknown error')
        }
    }

    async get(
        url: string,
        headers: Record<string, string>,
        signal?: AbortSignal,
        retry = 3
    ) {
        let requestError: ApiError | NetworkError | null = null
        for (let i = 0; i < retry + 1; i++) {
            try {
                const res = await fetch(url, {
                    method: 'GET',
                    headers,
                    signal,
                })
                if (!res.ok) {
                    const response = await res.text().catch((e) => '')
                    const errorCodeName = parseJsonOrEmpty(response)?.error?.code
                    const lumosAIError = LumosAIAPIError.fromCodeName(response, errorCodeName)
                    if (lumosAIError) {
                        throw lumosAIError
                    }
                    throw new ApiError(`Status Code ${res.status}, ${response}`)
                }
                return res
            } catch (e) {
                if (e instanceof BaseError) {
                    requestError = e
                } else {
                    const err = e as Error
                    const origin = new URL(url).origin
                    requestError = new NetworkError(err.message, origin)
                }
            }
        }
        if (requestError) {
            throw requestError
        } else {
            throw new Error('Unknown error')
        }
    }

}

export interface LumosAIMessage {
    role: MessageRole
    content: string
    pictures?: {
        base64?: string
    }[]
    files?: {
        uuid: string
    }[]
}

export async function populateLumosAIMessage(rawMessages: Message[]): Promise<LumosAIMessage[]> {
    const messages: LumosAIMessage[] = []
    for (const raw of rawMessages) {
        const newMessage: LumosAIMessage = {
            role: raw.role,
            content: raw.content,
        }
        messages.push(newMessage)
    }
    return messages
}
