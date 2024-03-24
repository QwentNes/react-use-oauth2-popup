import React, { createContext, useContext } from 'react';
import templates from './constants/templates';
import createOAuthUrl from './lib/createOAuthUrl';
import prepareRedirectUri from './lib/prepareRedirectUri';
import Helpers from './lib/helpers';
import {
   Method,
   OAuthContextProvider,
   OAuthParamsConfig,
   PopupViewParams,
   Provider,
   ProviderParams,
   ProvidersParams,
   RedirectUriParams
} from './types';

/**
 * `OAuthPrams` allows you to create a configuration for using the `useOAuth` and `useOAuthPopup` hooks
 *
 * Create a configuration outside the component
 *
 *```tsx
 * import { OAuthParams } from 'react-use-oauth2-popup';
 * const params = new OAuthParams(redirectUri, providers)
 * ```
 *
 * `redirectUri`:
 * - this is the URL where the browser will redirect after the user authorizes access
 * - the string must contain :provider and :method
 * - specifies the path to the page where the `useOAuthPopup` hook is called
 *
 * ```tsx
 * const params = new OAuthParams('/external/:provider/:method', providers)
 * ```
 * **Important!** In order for `redirectUri` to work correctly, configure your application router correctly using `dynamic path`
 * - [nextjs-router](https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes)
 * - [react-router-dom](https://reactrouter.com/en/main/route/route#dynamic-segments)
 *
 * ```tsx
 * // example for react-router-dom
 * import { OAuthParams, OAuthProvider } from 'react-use-oauth2-popup';
 * import { createBrowserRouter, RouterProvider } from 'react-router-dom';
 *
 * const REDIRECT_URI = '/external/:provider/:method';
 *
 * const params = new OAuthParams(REDIRECT_URI, providers)
 *
 * const router = createBrowserRouter([
 *   {
 *     path: '/login',
 *     element: <LoginPage />
 *   },
 *   {
 *     path: REDIRECT_URI,
 *     element: <PopupPage />
 *   }
 * ]);
 *
 * const App = () => {
 *   return (
 *     <OAuthProvider params={params}>
 *       <RouterProvider router={router} />
 *     </OAuthProvider>
 *   );
 * };
 * ```
 *
 * `providers`:
 * - this is an enumeration of all the providers that will be used
 *
 * The url can be created based on the specified parameters:
 * - base_path: authorization server URL
 * - client_id: public identifier for the app
 * - scope?: the request may have one or more scope values indicating additional access requested by the application
 * - response_type?: defines response type after authentication: token or code (default: code)
 * - other_params?: lists any parameters that will be included in the URL name=value
 *
 * ```tsx
 * const params = new OAuthParams('/external/:provider/:method', {
 *    ['provider name']: {
 *       url: {
 *          base_path: 'https://base-path.com?',
 *          client_id: process.env.client_id,
 *          response_type: 'code',
 *          scope: ['email', 'userinfo'],
 *       },
 *       popup: {
 *          height: 600,
 *          width: 500
 *       }
 *    },
 * });
 * ```
 *
 * Or it can be created manually:
 *
 * ```tsx
 * const params = new OAuthParams(`external/:method/:provider`, {
 *    ['provider name']: {
 *       url: (redirect_uri, state) =>
 *             `https://base-path.com?redirect_uri=${redirect_uri}&state=${state}&....`,
 *    }
 * })
 * ```
 *
 * *Be sure to use `redirectUri` and `state` from the function arguments*
 *
 * *Recommendation: To strictly specify the lists of available `methods` and `providers`,
 * use the extension of the definition of `CustomTypeOptions`*
 *
 * You can also use pre-defined TypeScript OAuth templates
 * ([GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps),
 * [Discord](https://discord.com/developers/docs/topics/oauth2),
 * [VK](https://dev.vk.com/ru/api/oauth-parameters),
 * [Twitch](https://dev.twitch.tv/docs/authentication/),
 * [Google](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow),
 * [LinkedIn](https://developer.linkedin.com/blog/posts/2018/redirecting-oauth-uas),
 * [Microsoft](https://learn.microsoft.com/ru-ru/entra/identity-platform/v2-oauth2-auth-code-flow)).
 *
 * Usage example:
 *
 * ```tsx
 * const params = new OAuthParams(`external/:provider/:method`, (templates) => ({
 *     google: templates.google({
 *       client_id: process.env.google_client_id,
 *       response_type: 'code',
 *       include_granted_scopes: true,
 *       scope: [...scopes]
 *     }),
 *     discord: templates.discord({
 *       client_id: process.env.discord_client_id,
 *       response_type: 'code',
 *       prompt: 'consent',
 *       scope: [...scopes]
 *     })
 * }))
 * ```
 * */
class OAuthParams {
   private readonly providers: ProvidersParams;
   private readonly redirectUri: RedirectUriParams;

   constructor(redirectUriPattern: string, providers: OAuthParamsConfig) {
      this.providers = Helpers.IsFunction(providers) ? providers(templates) : providers;
      this.redirectUri = prepareRedirectUri(redirectUriPattern);
   }

   public getRedirectUriPattern = (): string => {
      return this.redirectUri.pattern;
   };

   public getProvider = (provider: Provider): ProviderParams => {
      const data = this.providers[provider];
      if (!data) {
         throw new Error(`Provider ${provider} not found`);
      }

      return data;
   };

   public createWindowParams = (
      state: string,
      provider: Provider,
      method: Method,
      popupParams?: PopupViewParams
   ) => {
      const { popup, url } = this.getProvider(provider);
      const redirectUrl = this.redirectUri.create(provider, method);

      let oauthUrl;
      if (Helpers.IsFunction(url)) {
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

const OAuthParamsContext = createContext<OAuthParams | undefined>(undefined);

/**
 * Use the `OAuthProvider` component to provide a `OAuthParams` to your application:
 *
 * ```tsx
 * // example for react-router-dom
 * import { OAuthParams, OAuthProvider } from 'react-use-oauth2-popup';
 * import { createBrowserRouter, RouterProvider } from 'react-router-dom';
 *
 * const REDIRECT_URI = '/external/:provider/:method';
 *
 * const params = new OAuthParams(REDIRECT_URI, {
 *    google: {
 *       url: {
 *          base_path: 'https://accounts.google.com/o/oauth2/v2/auth',
 *          client_id: process.env.google_client_id,
 *          scope: ['https://www.googleapis.com/auth/userinfo.email']
 *       }
 *    },
 *    discord: {
 *       url: {
 *          base_path: 'https://discord.com/oauth2/authorize',
 *          client_id: process.env.discord_client_id,
 *          scope: 'identify'
 *       },
 *       popup: {
 *          height: 600,
 *          width: 500
 *       }
 *    }
 * });
 *
 * const router = createBrowserRouter([
 *   {
 *     path: '/login',
 *     element: <LoginPage />
 *   },
 *   {
 *     path: REDIRECT_URI,
 *     element: <PopupPage />
 *   }
 * ]);
 *
 * const App = () => {
 *   return (
 *     <OAuthProvider params={params}>
 *       <RouterProvider router={router} />
 *     </OAuthProvider>
 *   );
 * };
 *
 * ```
 * */
const OAuthProvider: OAuthContextProvider = (props) => {
   const { children, params } = props;

   // prettier-ignore
   return (
      <OAuthParamsContext.Provider value={params}>
         {children}
      </OAuthParamsContext.Provider>
   );
};

const useOAuthContext = () => {
   const context = useContext(OAuthParamsContext);

   if (!context) {
      throw new Error('No OAuthParams set, use OAuthProvider to set one');
   }

   return context;
};

export { OAuthParams, OAuthProvider, useOAuthContext };
