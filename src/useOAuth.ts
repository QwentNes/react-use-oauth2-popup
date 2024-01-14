import { useEffect, useRef, useState } from 'react';
import createPopup from './lib/createPopup';
import { useOAuthContext } from './OAuthProvider';
import {
   AuthEventHandlers,
   Method,
   PopupEventResponse,
   PopupViewParams,
   Provider
} from './types';

export function useOAuth<D = unknown, E = unknown>(
   method: Method,
   events?: Partial<AuthEventHandlers<D, E>>
) {
   const popupRef = useRef<Window | null>(null);
   const { createWindowParams, generateString } = useOAuthContext();
   const { onOpen, onClose, onSuccess, onError } = getEventHandlers();
   const [activeProvider, setActiveProvider] = useState<Provider | null>(null);

   function getEventHandlers(): AuthEventHandlers<D, E> {
      function resetPopupRef() {
         popupRef.current?.close();
         popupRef.current = null;
      }

      return {
         onSuccess(response) {
            resetPopupRef();
            events?.onClose?.();
            Promise.resolve(events?.onSuccess?.(response)).finally(() => {
               setActiveProvider(null);
            });
         },
         onError(error) {
            resetPopupRef();
            events?.onError?.(error);
         },
         onOpen(provider) {
            setActiveProvider(provider);
            events?.onOpen?.(provider);
         },
         onClose() {
            resetPopupRef();
            setActiveProvider(null);
            events?.onClose?.();
         }
      };
   }

   function generateState() {
      const randomString = generateString();
      window.localStorage.setItem('oauth-state', randomString);

      return randomString;
   }

   function openPopup(provider: Provider, popupParams?: PopupViewParams) {
      return () => {
         if (popupRef.current || activeProvider) {
            return popupRef.current?.focus();
         }

         const params = createWindowParams(
            generateState(),
            provider,
            method,
            popupParams
         );
         popupRef.current = createPopup(params);
         onOpen(provider);
      };
   }

   function closePopup() {
      if (popupRef.current && !popupRef.current?.closed) {
         onClose();
      }
   }

   useEffect(() => {
      if (!popupRef.current || popupRef.current?.closed) return;

      const checkInterval = setInterval(() => {
         if (popupRef.current?.closed) {
            onClose();
         }
      }, 400);

      return () => {
         clearInterval(checkInterval);
      };
   }, [activeProvider]);

   useEffect(() => {
      //@ts-ignore (generic error microbundle)
      function messageHandler({ data }: MessageEvent<PopupEventResponse<D, E>>) {
         const { result, payload, source } = data || {};
         if (source === 'oauth-popup') {
            result === 'success' ? onSuccess(payload) : onError(payload);
         }
      }

      window.addEventListener('message', messageHandler, false);
      return () => {
         window.removeEventListener('message', messageHandler);
         closePopup();
      };
   }, []);

   return {
      closePopup,
      openPopup,
      activeProvider
   };
}
