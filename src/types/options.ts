import { MergeTypes } from './helpers'

export interface CustomTypesOptions {}

export type OAuthHookTypes = MergeTypes<
  {
    /**
     *
     * @default string
     * @example 'google' | 'discord'
     * @description OAuth2 Provider Names
     *
     */
    provider: string

    /**
     *
     * @default string
     * @example 'login' | 'connect'
     * @description OAuth2 methods
     *
     */
    method: string
  },
  CustomTypesOptions
>
