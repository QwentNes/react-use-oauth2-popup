import { useEffect, useState } from 'react';
import { ErrorCodes, SOURCE_KEY, STORAGE_STATE_KEY } from './constants/common';
import Helpers from './lib/helpers';
import parseUrl from './lib/parseUrl';
import { useOAuthContext } from './OAuthProvider';
import {
   HandlerData,
   Method,
   MethodHandler,
   MethodHandlers,
   OAuthErrorCodes,
   OAuthStatus,
   PopupError,
   PopupStatus,
   UrlNamedParams
} from './types';

type PopupConfig = {
   /**
    * This function will fire when the page is opened manually
    *
    * Default: Redirects the user to the main page
    *
    * ```tsx
    *    () => window.location.assign(window.location.origin)
    * ```
    * */
   directAccessHandler: VoidFunction;

   /**
    * Allows you to set the delay in milliseconds for closing the popup
    *
    * Works in all cases (success, error)
    *
    * It may be useful to display an animation after the authorization process is completed
    *
    * Default: 0ms
    * */
   delayClose: number;
};

type OAuthPopupReturnType = {
   /**
    * Displays the status of the popup
    *
    * Will be
    * - `idle` initial state. Does not change if the page is opened manually
    * - `running` if it processes the received data
    * - `success` if the data has been processed successfully
    * - `error` if the data has been processed unsuccessfully
    * */
   status: PopupStatus;

   /**
    * A derived boolean from the status variable above, provided for convenience
    * */
   isIdle: boolean;

   /**
    * A derived boolean from the status variable above, provided for convenience
    * */
   isRunning: boolean;

   /**
    * A derived boolean from the status variable above, provided for convenience
    * */
   isError: boolean;

   /**
    * A derived boolean from the status variable above, provided for convenience
    * */
   isSuccess: boolean;
};

/**
 * The hook should be called on the page specified in the `redirectUri`
 *
 * After receiving the credentials from the provider, this page will be
 * opened and the appropriate handler method will be called
 *
 * After processing the data, the popup will be closed automatically, even if an error occurs
 *
 * If you want to use **one** handler for all methods, then just pass the function as the first argument
 *
 * ```tsx
 *
 * import { useOAuthPopup } from 'react-use-oauth2-popup'
 *
 * const PopupPage = () => {
 *    const { isSuccess, isError } = useOAuthPopup(
 *       async ({ provider, credentials }) => {
 *          const res = await fetch(`example.com/${provider}/auth`, {
 *             method: 'POST',
 *             body: JSON.stringify(credentials)
 *          });
 *          return res.json();
 *       });
 *
 *    if (isSuccess) {
 *       return <SuccessIcon / >
 *    }
 *
 *    if (isError) {
 *       return <ErrorIcon / >
 *    }
 *
 *    return <LoaderIcon / >
 * };
 *
 * ```
 *
 * *Recommendation: use handlers to send `credentials` to the server*
 * */
function useOAuthPopup(
   handlers: MethodHandler,
   config?: Partial<PopupConfig>
): OAuthPopupReturnType;

/**
 * The hook should be called on the page specified in the "redirectUri"
 *
 * After receiving the credentials from the provider, this page will be
 * opened and the appropriate handler method will be called
 *
 * After processing the data, the popup will be closed automatically, even if an error occurs
 *
 * If you want to use separate handlers for each method, pass an object with the method name
 * and its corresponding processing function
 *
 * For **example**, in our application, the `useOAuth` hook is called twice,
 * for authorization and connection. We want to separate the logic by using different handlers.
 *
 * ```tsx
 *
 * import { useOAuthPopup } from 'react-use-oauth2-popup'
 *
 * const PopupPage = () => {
 *    const { isSuccess, isError } = useOAuthPopup({
 *       async auth(data) {
 *          const res = await fetch(`example.com/auth`, {
 *             method: 'POST',
 *             body: JSON.stringify(data)
 *          });
 *          return res.json();
 *       },
 *       async connect({ credentials }) {
 *          const res = await fetch(`example.com/connect`, {
 *             method: 'POST',
 *             body: JSON.stringify(credentials)
 *          });
 *          return res.json();
 *       }
 *    });
 *
 *    if (isSuccess) {
 *       return <SuccessIcon / >
 *    }
 *
 *    if (isError) {
 *       return <ErrorIcon / >
 *    }
 *
 *    return <LoaderIcon / >
 * };
 *
 * ```
 *
 * You can also specify the default handler.
 *
 * If no handler is defined for a particular method, `default` will be called
 *
 * **Important!** If you do not specify the `method` name for `useOAuth`, the `default` handler is required
 *
 * ```tsx
 *
 * import { useOAuthPopup } from 'react-use-oauth2-popup'
 *
 * const PopupPage = () => {
 *    const { isSuccess, isError } = useOAuthPopup({
 *       async auth(data) {
 *          const res = await fetch(`example.com/auth`, {
 *             method: 'POST',
 *             body: JSON.stringify(data)
 *          });
 *          return res.json();
 *       },
 *       default(data){
 *          // default logic...
 *       }
 *    });
 *
 *    if (isSuccess) {
 *       return <SuccessIcon / >
 *    }
 *
 *    if (isError) {
 *       return <ErrorIcon / >
 *    }
 *
 *    return <LoaderIcon / >
 * };
 *
 * ```
 *
 * *Recommendation: use handlers to send `credentials` to the server*
 * */
function useOAuthPopup(
   handlers: MethodHandlers,
   config?: Partial<PopupConfig>
): OAuthPopupReturnType;

function useOAuthPopup(
   handlers: MethodHandler | MethodHandlers,
   config?: Partial<PopupConfig>
): OAuthPopupReturnType {
   const [status, setStatus] = useState<PopupStatus>(PopupStatus.idle);
   const { getRedirectUriPattern } = useOAuthContext();
   const _config: PopupConfig = {
      delayClose: 0,
      directAccessHandler: () => window.location.assign(window.location.origin),
      ...config
   };

   function getParamsFromUrl() {
      return parseUrl(window.location.href, getRedirectUriPattern());
   }

   function createError<C extends OAuthErrorCodes>(code: C, details?: unknown) {
      return { code, details };
   }

   function getCallback(method: Method) {
      const callback = Helpers.IsFunction<MethodHandler>(handlers)
         ? handlers
         : handlers[method] || handlers['default'];

      if (!callback || !Helpers.IsFunction(callback)) {
         throw Error(`No handler or default handler was found for method ${method}`);
      }

      return (config: HandlerData) => Promise.resolve(callback(config));
   }

   function checkState(state: string) {
      const localState = window.localStorage.getItem(STORAGE_STATE_KEY);
      window.localStorage.removeItem(STORAGE_STATE_KEY);

      if (state !== localState) {
         throw createError(ErrorCodes.StateMismatch);
      }
   }

   function checkParams({ namedParams, queryParams }: ReturnType<typeof parseUrl>) {
      const { state, error } = queryParams;
      const { provider, method } = namedParams;

      if (error) {
         throw createError(ErrorCodes.FailureResponse, queryParams);
      }

      checkState(state);
      if (!Helpers.AllDefined(provider, method, state)) {
         throw createError(ErrorCodes.InvalidParameters);
      }
   }

   function postMessage(this: UrlNamedParams, payload: object) {
      const message = {
         source: SOURCE_KEY,
         payload: Object.assign({}, this, payload),
         result: Helpers.IsContainsField(payload, 'data')
            ? OAuthStatus.success
            : OAuthStatus.error
      };

      const send = () => window.opener.postMessage(message, location.origin);
      _config.delayClose <= 0 ? send() : setTimeout(send, _config.delayClose);
   }

   useEffect(() => {
      if (!window.opener) {
         return _config.directAccessHandler();
      }

      setStatus(PopupStatus.running);
      const urlParams = getParamsFromUrl();
      const { namedParams, queryParams: credentials } = urlParams;
      const sendResponse = postMessage.bind(namedParams || {});

      try {
         checkParams(urlParams);
         const { provider, method } = namedParams;

         getCallback(method)({ method, provider, credentials })
            .then((data) => {
               setStatus(PopupStatus.success);
               sendResponse({ data, credentials });
            })
            .catch((error) => {
               setStatus(PopupStatus.error);
               sendResponse(createError(ErrorCodes.CallbackError, error));
            });
      } catch (_error) {
         setStatus(PopupStatus.error);
         const error = <PopupError<never>>_error;
         if (error?.code) {
            return sendResponse(error);
         }
         throw error;
      }
   }, []);

   return {
      status,
      isIdle: status === PopupStatus.idle,
      isRunning: status === PopupStatus.running,
      isError: status === PopupStatus.error,
      isSuccess: status === PopupStatus.success
   };
}

export { useOAuthPopup };
