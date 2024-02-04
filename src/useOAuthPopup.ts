import { useEffect, useState } from 'react';
import {
   CallbackError,
   FailureResponse,
   InvalidParameters,
   StateMismatch
} from './constants/errors';
import parseUrl from './lib/parseUrl';
import { useOAuthContext } from './OAuthProvider';
import {
   HandlerData,
   Method,
   MethodHandler,
   MethodHandlers,
   OAuthErrorCodes,
   PopupConfig,
   PopupError,
   UrlNamedParams
} from './types';

enum PopupStatus {
   idle = 'idle',
   running = 'running',
   success = 'success',
   error = 'error'
}

function useOAuthPopup(handlers: MethodHandlers, config?: Partial<PopupConfig>) {
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
      // prettier-ignore
      const callback: MethodHandler = typeof handlers === 'object'
         ? handlers[method] || handlers['default']
         : handlers;

      if (!callback) {
         throw Error(`No handler or default handler was found for method ${method}`);
      }

      return (config: HandlerData) => Promise.resolve(callback(config));
   }

   function checkState(state: string) {
      const localState = window.localStorage.getItem('oauth-state');
      window.localStorage.removeItem('oauth-state');

      if (state !== localState) {
         throw createError(StateMismatch);
      }
   }

   function checkParams({ namedParams, queryParams }: ReturnType<typeof parseUrl>) {
      const { state, error } = queryParams;
      const { provider, method } = namedParams;

      if (error) {
         throw createError(FailureResponse, queryParams);
      }

      checkState(state);
      if (![provider, method, state].every(Boolean)) {
         throw createError(InvalidParameters);
      }
   }

   function postMessage(this: UrlNamedParams, payload: object) {
      const message = {
         source: 'oauth-popup',
         result: Object.prototype.hasOwnProperty.call(payload, 'data')
            ? 'success'
            : 'error',
         payload: Object.assign({}, this, payload)
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
               sendResponse(createError(CallbackError, error));
            });
      } catch (_error) {
         setStatus(PopupStatus.error);
         const error = _error as PopupError<never>;
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
