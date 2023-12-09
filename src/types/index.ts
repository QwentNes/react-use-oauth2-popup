import { JSX, ReactNode } from 'react'
import templates from '../constants/templates'
import { OAuthParams } from '../OAuthParams'
import { PreservedValue } from './helpers'
import { OAuthHookTypes } from './options'

export type Provider = PreservedValue<OAuthHookTypes['provider'], string>
export type Method = PreservedValue<OAuthHookTypes['method'], string>

export type OAuthContextProvider = (props: {
  children: ReactNode
  params: OAuthParams
}) => JSX.Element

type OAuthTemplates = typeof templates

export type OAuthParamsConfig =
  | ((templates: OAuthTemplates) => {
      redirectUri: RedirectUriParams | string
      providers: ProvidersParams
    })
  | {
      redirectUri: RedirectUriParams | string
      providers: ProvidersParams
    }

export type ProvidersParams = Record<Provider, ProviderParams>

export type ProviderParams = {
  url:
    | ((redirect_uri: string, state: string) => string)
    | (Omit<OAuthReqParams, 'state' | 'redirect_uri'> & { base_path: string })
  popup?: PopupViewParams
}

export type RedirectUriParams = {
  pathname: string
  origin?: string
}

export type OAuthReqParams = {
  state: string
  scope?: string[] | string
  client_id: string
  redirect_uri: string
  response_type?: 'code' | 'token'
  other_params?: Record<string, string | string[] | number[] | boolean>
}

export type PopupParams = {
  url: string
  title: string
} & PopupViewParams

export type PopupViewParams = Partial<{
  width: number
  height: number
  position?:
    | 'center'
    | {
        topOffset?: number
        leftOffset?: number
      }
}>

export type AuthEvents = Partial<{
  onSuccess: (response: PopupSuccess) => Promise<void> | void
  onError: (error: PopupError) => void
  onOpen: () => void
  onClose: () => void
}>

export type UseOAuthReturnType = {
  active: Provider | null
  openPopup: (provider: Provider) => () => void
  isInProcess: boolean
}

export type MethodHandler = (config: {
  method: Method
  provider: Provider
  credentials: UrlQueryParams
}) => Promise<unknown>

export type MethodHandlers =
  | {
      [key in Method]: MethodHandler
    }
  | ({ [key in Method]?: MethodHandler } & {
      default: MethodHandler
    })

export type UrlNamedParams = {
  provider: Provider
  method: Method
}

export type UrlQueryParams = {
  from: 'hash' | 'query'
  state: string
} & Record<string, string>

export type PopupEventResponse = { source: 'oauth-popup' } & (
  | {
      result: 'success'
      payload: PopupSuccess
    }
  | {
      result: 'error'
      payload: PopupError
    }
)

export type PopupSuccess<S = unknown> = {
  conditionals: UrlQueryParams
  data?: S
} & UrlNamedParams

export type PopupError<E = unknown> = {
  errorCode: string
  error?: E
} & Partial<UrlNamedParams>

export { CustomTypeOptions } from './options'

export {
  DiscordArgs,
  GitHubArgs,
  GoogleArgs,
  TwitchArgs,
  VkontakteArgs,
  TemplateArgs
} from './templates'
