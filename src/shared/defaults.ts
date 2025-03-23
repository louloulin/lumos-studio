import { Theme, Config, Settings, ModelProvider, Session, Language, Message, MessageRoleEnum } from './types'
import { v4 as uuidv4 } from 'uuid'

export const DEFAULT_MODEL = 'gpt-3.5-turbo'
export const DEFAULT_TEMPERATURE = 0.7
export const DEFAULT_MAX_TOKENS = 2048
export const DEFAULT_MAX_CONTEXT_MESSAGE_COUNT = 10
export const DEFAULT_LANGUAGE = 'en' as Language
export const DEFAULT_THEME = Theme.FollowSystem
export const DEFAULT_FONT_SIZE = 12
export const DEFAULT_PRESERVE_SESSIONS = true
export const DEFAULT_AUTO_SAVE = true
export const DEFAULT_SAVE_INTERVAL = 30000
export const DEFAULT_PROXY = ''
export const DEFAULT_API_HOST = 'https://api.openai.com'
export const DEFAULT_API_KEY = ''
export const ABOUT_DIALOG_VERSION = '1.0.0'

export function settings(): Settings {
    return {
        aiProvider: ModelProvider.LumosAI,
        model: 'gpt-3.5-turbo',
        temperature: DEFAULT_TEMPERATURE,
        topP: 1,
        openaiMaxContextMessageCount: DEFAULT_MAX_CONTEXT_MESSAGE_COUNT,
        showWordCount: true,
        showTokenCount: false,
        showTokenUsed: true,
        showModelName: true,
        showMessageTimestamp: false,
        openaiKey: '',
        apiHost: DEFAULT_API_HOST,
        theme: DEFAULT_THEME,
        language: DEFAULT_LANGUAGE,
        fontSize: DEFAULT_FONT_SIZE,
        spellCheck: true,
        allowReportingAndTracking: false,
        preserveSessions: true,
        autoSave: true,
        saveInterval: 30000,
        claudeApiKey: '',
        claudeApiHost: DEFAULT_API_HOST,
        claudeModel: 'claude-3-opus-20240229',
        ollamaHost: 'http://localhost:11434',
        ollamaModel: '',
        lmStudioHost: 'http://localhost:1234',
        lmStudioModel: '',
        siliconCloudHost: DEFAULT_API_HOST,
        siliconCloudKey: '',
        siliconCloudModel: 'custom-model',
        ppioHost: 'https://api.ppio.cloud',
        ppioKey: '',
        ppioModel: 'pplx-14b-chat',
        enableMarkdownRendering: true,
        autoGenerateTitle: true,
        lumosAIModel: 'lumosai-3.5',
        mastraAgentName: '',
        azureEndpoint: '',
        azureDeploymentName: '',
        azureDalleDeploymentName: '',
        azureApikey: '',
        chatglm6bUrl: '',
        licenseKey: '',
        licenseInstances: {},
    }
}

export function newConfigs(): Config {
    return { uuid: uuidv4() }
}

export function getDefaultPrompt() {
    return 'You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.'
}

export function sessions(): Session[] {
    return [{ id: uuidv4(), name: 'Untitled', messages: [], type: 'chat' }]
}
