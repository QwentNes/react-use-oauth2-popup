import { v4 as uuid_v4 } from 'uuid'
import templates from './constants/templates'
import createOAuthUrl from './lib/createOAuthUrl'
import {
  Method,
  OAuthParamsConfig,
  Provider,
  ProvidersParams,
  RedirectUriParams
} from './types'

export class OAuthParams {
  readonly #providers: ProvidersParams
  readonly #redirectUri: RedirectUriParams

  constructor(params: OAuthParamsConfig) {
    const { providers, redirectUri } =
      typeof params === 'function' ? params(templates) : params

    this.#providers = providers
    this.#redirectUri = redirectUri
  }

  createState = () => {
    return uuid_v4().replace('-', '')
  }

  getRedirectUrlPattern = () => {
    return this.#redirectUri.pathname
  }

  getProviderNames = () => {
    return Object.keys(this.#providers)
  }

  getProvider = (provider: Provider) => {
    const data = this.#providers[provider]

    if (!data) {
      throw new Error(`Provider ${provider} not found`)
    }
    return data
  }

  createRedirectUrl = (provider: Provider, method: Method) => {
    const { origin, pathname } = this.#redirectUri
    const baseUrl = origin || window.location.origin
    return new URL(
      pathname.replace(':provider', provider).replace(':method', method),
      baseUrl
    ).href
  }

  getOAuthUrlFn = (provider: Provider) => {
    const { url } = this.getProvider(provider)

    if (typeof url === 'function') {
      return url
    }

    const { base_path, ...urlParams } = url

    return (redirect_uri: string, state: string) =>
      createOAuthUrl(base_path, {
        redirect_uri,
        state,
        ...urlParams
      })
  }

  createPopupParams = (provider: Provider, method: Method) => {
    const { popup } = this.getProvider(provider)
    const state = this.createState()

    return {
      title: `external_${method}`,
      url: this.getOAuthUrlFn(provider)(this.createRedirectUrl(provider, method), state),
      popup,
      state
    }
  }
}
