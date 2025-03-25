import {
    Config,
    CopilotDetail,
    SponsorAboutBanner,
    SponsorAd,
    RemoteConfig,
    Settings,
    LumosAIModel,
} from '@/shared/types'
import { ofetch } from 'ofetch'

export const API_ORIGIN = 'https://lumosai.app'


export async function checkNeedUpdate(version: string, os: string, config: Config, settings: Settings) {
    type Response = {
        need_update?: boolean
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/ce/lumos_need_update/${version}`, {
        method: 'POST',
        retry: 3,
        body: {
            uuid: config.uuid,
            os: os,
            allowReportingAndTracking: settings.allowReportingAndTracking ? 1 : 0,
        },
    })
    return !!res['need_update']
}

export async function listCopilots(lang: string) {
    type Response = {
        data: CopilotDetail[]
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/copilots/list`, {
        method: 'POST',
        retry: 3,
        body: { lang },
    })
    return res['data']
}

export async function recordCopilotShare(detail: CopilotDetail) {
    await ofetch(`${API_ORIGIN}/api/copilots/share-record`, {
        method: 'POST',
        body: {
            detail: detail,
        },
    })
}

export async function getRemoteConfig(config: keyof RemoteConfig) {
    type Response = {
        data: Pick<RemoteConfig, typeof config>
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/remote_config/${config}`, {
        retry: 3,
    })
    return res['data']
}

export interface DialogConfig {
    markdown: string
    buttons: { label: string; url: string }[]
}

export async function getDialogConfig(params: { uuid: string; language: string; version: string }) {
    type Response = {
        data: null | DialogConfig
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/dialog_config`, {
        method: 'POST',
        retry: 3,
        body: params,
    })
    return res['data'] || null
}

export interface LumosAILicenseDetail {
    license_id: string
    state: 'active' | 'disabled' | 'expired'
    expiry_date: string
    license_type: string
    customer_name: string
    customer_email: string
    quota: {
        [key: string]: Quota
    }
    plan_id?: string
    type: LumosAIModel
    name: string
    defaultModel: LumosAIModel
    remaining_quota_35: number
    remaining_quota_4: number
    remaining_quota_image: number
    image_used_count: number
    image_total_quota: number
    token_refreshed_time: string
    token_expire_time: string | null | undefined
}

interface Quota {
    used: number
    limit: number
    reset_date: string
}

export async function getLumosAILicenseDetail(licenseKey: string) {
    return makeRemoteCall<{
        data: LumosAILicenseDetail | null
    }>('getLumosAILicenseDetail', {
        licenseKey,
    })
}

export async function activateLumosAILicense(licenseKey: string) {
    return makeRemoteCall<{
        data: LumosAILicenseDetail | null
    }>('activateLumosAILicense', {
        licenseKey,
    })
}

export async function getLicenseDetail(params: { licenseKey: string }) {
    type Response = {
        data: LumosAILicenseDetail | null
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/license/detail`, {
        retry: 3,
        headers: {
            Authorization: params.licenseKey,
        },
    })
    return res['data'] || null
}

export async function getLicenseDetailRealtime(params: { licenseKey: string }) {
    type Response = {
        data: LumosAILicenseDetail | null
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/license/detail/realtime`, {
        retry: 3,
        headers: {
            Authorization: params.licenseKey,
        },
    })
    return res['data'] || null
}

export async function activateLicense(params: {
    licenseKey: string,
    instanceName: string
}) {
    type Response = {
        data: {
            valid: boolean
            instanceId: string
            error: string
        }
    }
    const res = await ofetch(`${API_ORIGIN}/api/license/activate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    })
    const json: Response = await res.json()
    return json['data']
}

export async function deactivateLicense(params: {
    licenseKey: string,
    instanceId: string
}) {
    await ofetch(`${API_ORIGIN}/api/license/deactivate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    })
}

export async function validateLicense(params: {
    licenseKey: string,
    instanceId: string
}) {
    type Response = {
        data: {
            valid: boolean
        }
    }
    const res = await ofetch(`${API_ORIGIN}/api/license/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    })
    const json: Response = await res.json()
    return json['data']
}

async function makeRemoteCall<T>(endpoint: string, data: any): Promise<T> {
    const response = await ofetch<T>(`${API_ORIGIN}/api/${endpoint}`, {
        method: 'POST',
        retry: 3,
        body: data
    });
    return response;
}
