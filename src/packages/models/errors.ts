export class BaseError extends Error {
    public code = 1
    constructor(message: string) {
        super(message)
    }
}

// 10000 - 19999 is for general errors

export class ApiError extends BaseError {
    public code = 10001
    constructor(message: string) {
        super('API Error: ' + message)
    }
}

export class NetworkError extends BaseError {
    public code = 10002
    public host: string
    constructor(message: string, host: string) {
        super('Network Error: ' + message)
        this.host = host
    }
}

export class AIProviderNoImplementedPaintError extends BaseError {
    public code = 10003
    constructor(aiProvider: string) {
        super(`Current AI Provider ${aiProvider} Does Not Support Painting`)
    }
}

export class AIProviderNoImplementedChatError extends BaseError {
    public code = 10005
    constructor(aiProvider: string) {
        super(`Current AI Provider ${aiProvider} Does Not Support Chat Completions API`)
    }
}

// 20000 - 29999 is for Lumos AI errors

// Define error details dictionary
const errorDetails: Record<string, LumosAIAPIErrorDetail> = {
    'token_quota_exhausted': {
        message: 'You have reached your monthly quota for this model',
        status: 429
    },
    'license_upgrade_required': {
        message: 'Your current license does not support this model',
        status: 403
    },
    'expired_license': {
        message: 'Your license has expired',
        status: 403
    },
    'license_key_required': {
        message: 'License key is required',
        status: 401
    },
    'license_not_found': {
        message: 'License not found',
        status: 404
    },
    'rate_limit_exceeded': {
        message: 'Rate limit exceeded',
        status: 429
    },
    'bad_params': {
        message: 'Invalid request parameters',
        status: 400
    },
    'file_type_not_supported': {
        message: 'File type not supported',
        status: 415
    },
    'file_expired': {
        message: 'File has expired',
        status: 410
    },
    'file_not_found': {
        message: 'File not found',
        status: 404
    },
    'file_too_large': {
        message: 'File too large',
        status: 413
    },
    'model_not_support_file': {
        message: 'Model does not support files',
        status: 400
    },
    'model_not_support_image': {
        message: 'Model does not support images',
        status: 400
    }
};

export class LumosAIAPIError extends Error {
    code: string
    
    constructor(message: string, code: string) {
        super(message)
        this.code = code
    }
    
    static fromCodeName(code: string, i18nKey?: string): LumosAIAPIError {
        const detail = this.getDetail(code)
        const message = detail?.message || ''
        const err = new LumosAIAPIError(message, code)
        if (i18nKey) {
            // @ts-ignore
            err.i18nKey = i18nKey
        }
        return err
    }
    
    static getDetail(code: string): LumosAIAPIErrorDetail | undefined {
        return code ? errorDetails[code] : undefined
    }
}

export interface LumosAIAPIErrorDetail {
    message: string
    status?: number
}

// For backward compatibility - these will be removed in a future version
// export { LumosAIAPIError as LumosAIAPIError }
// export type { LumosAIAPIErrorDetail as LumosAIAPIErrorDetail }
