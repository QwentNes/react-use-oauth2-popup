import { v4 as uuid_v4 } from 'uuid';
import templates from './constants/templates';
import createOAuthUrl from './lib/createOAuthUrl';
import createRedirectUrl from './lib/createRedirectUrl';
import {
   Method,
   OAuthParamsConfig,
   PopupViewParams,
   Provider,
   ProvidersParams
} from './types';

export class OAuthParams {
   readonly #providers: ProvidersParams;
   readonly #redirectUri: string;

   constructor(params: OAuthParamsConfig) {
      const { providers, redirectUri } =
         typeof params === 'function' ? params(templates) : params;
      this.#redirectUri = redirectUri;
      this.#providers = providers;
   }

   getRedirectUrlPattern = () => {
      return this.#redirectUri;
   };

   generateString = () => {
      return uuid_v4().replace(/-/g, '');
   };

   getProvider = (provider: Provider) => {
      const data = this.#providers[provider];
      if (!data) {
         throw new Error(`Provider ${provider} not found`);
      }

      return data;
   };

   getOAuthUrlFn = (provider: Provider) => {
      const { url } = this.getProvider(provider);

      if (typeof url === 'function') {
         return url;
      }
      const { base_path, ...urlParams } = url;

      return (redirect_uri: string, state: string) =>
         createOAuthUrl(base_path, {
            redirect_uri,
            state,
            ...urlParams
         });
   };

   createWindowParams = (
      state: string,
      provider: Provider,
      method: Method,
      popupParams?: PopupViewParams
   ) => {
      const { popup } = this.getProvider(provider);
      const redirectUrl = createRedirectUrl(
         this.getRedirectUrlPattern(),
         provider,
         method
      );

      return {
         title: `external_${method}`,
         url: this.getOAuthUrlFn(provider)(redirectUrl, state),
         popup: {
            ...popup,
            ...popupParams
         }
      };
   };
}
