import { MergeTypes } from './helpers'

export interface CustomTypeOptions {}

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
  CustomTypeOptions
>
