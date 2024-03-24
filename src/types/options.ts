import { MergeTypes } from './helpers';

/**
 * Typescript definitions can be extended to explicitly specify a list of providers and methods.
 *
 * Create an oauth.d.ts, for example:
 *
 * ```tsx
 * // import the original type declarations
 * import 'react-use-oauth2-popup'
 *
 * declare module 'react-use-oauth2-popup' {
 *   // Extend CustomTypeOptions
 *   interface CustomTypeOptions {
 *     provider: 'google' | 'discord' | ...
 *     method: 'login' | 'join' | 'connect' | ...
 *   }
 * }
 * ```
 * */
export interface CustomTypeOptions {}

export type OAuthHookTypes = MergeTypes<
   {
      provider: string;
      method: string;
   },
   CustomTypeOptions
>;
