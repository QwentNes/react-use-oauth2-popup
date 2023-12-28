import { useEffect, useState } from 'react';
import {
   CallbackError,
   CallbackNotFound,
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
   const { getRedirectUrlPattern } = useOAuthContext();
   const _config: PopupConfig = {
      delayClose: 0,
      directAccessHandler: () => window.location.assign(window.location.origin),
      ...config
   };

   function getParamsFromUrl() {
      return parseUrl(window.location.href, getRedirectUrlPattern());
   }

   function createError(errorCode: string, error?: object): PopupError {
      return { errorCode, error };
   }

   function getCallback(method: Method) {
      // prettier-ignore
      const callback: MethodHandler = typeof handlers === 'object'
         ? handlers[method] || handlers['default']
         : handlers;

      if (!callback) {
         throw createError(CallbackNotFound);
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
      checkState(state);

      if (error) {
         throw createError(FailureResponse, queryParams);
      }

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
         const error = _error as PopupError;
         if (error?.errorCode) {
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
