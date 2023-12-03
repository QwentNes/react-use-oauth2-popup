import { OAuthReqParams } from './index'

export type TemplateArgs<T = {}> = T &
  Pick<OAuthReqParams, 'client_id' | 'scope' | 'response_type'> &
  Record<string, string | boolean | string[] | number[]>

export type GoogleArgs = {
  include_granted_scopes?: boolean
  enable_granular_consent?: boolean
  login_hint?: string
  prompt?: 'none' | 'consent' | 'select_account' | 'consent select_account'
}

export type DiscordArgs = {
  prompt?: 'none' | 'consent'
}

export type VkontakteArgs = {
  display?: 'page' | 'popup' | 'mobile'
}

export type TwitchArgs = {
  force_verify?: boolean
}

export type GitHubArgs = {
  login?: string
  allow_signup?: boolean
  prompt?: 'none' | 'select_account'
}
