import templates from './constants/templates';
import createOAuthUrl from './lib/createOAuthUrl';
import prepareRedirectUri from './lib/prepareRedirectUri';
import {
   Method,
   OAuthParamsConfig,
   PopupViewParams,
   Provider,
   ProvidersParams,
   RedirectUriParams
} from './types';

export class OAuthParams {
   readonly #providers: ProvidersParams;
   readonly #redirectUri: RedirectUriParams;

   constructor(redirectUriPattern: string, providers: OAuthParamsConfig) {
      this.#redirectUri = prepareRedirectUri(redirectUriPattern);
      this.#providers =
         typeof providers === 'function' ? providers(templates) : providers;
   }

   getRedirectUriPattern = () => {
      return this.#redirectUri.pattern;
   };

   getProvider = (provider: Provider) => {
      const data = this.#providers[provider];
      if (!data) {
         throw new Error(`Provider ${provider} not found`);
      }

      return data;
   };

   createWindowParams = (
      state: string,
      provider: Provider,
      method: Method,
      popupParams?: PopupViewParams
   ) => {
      const { popup, url } = this.getProvider(provider);
      const redirectUrl = this.#redirectUri.create(provider, method);

      let oauthUrl;
      if (typeof url === 'function') {
         oauthUrl = url;
      } else {
         const { base_path, ...urlParams } = url;
         oauthUrl = (redirect_uri: string, state: string) =>
            createOAuthUrl(base_path, {
               redirect_uri,
               state,
               ...urlParams
            });
      }

      return {
         title: `external_${method}`,
         url: oauthUrl(redirectUrl, state),
         popup: Object.assign({}, popup, popupParams)
      };
   };
}
