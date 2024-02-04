import { useEffect, useRef, useState } from 'react';
import { v4 as uuid_v4 } from 'uuid';
import createPopup from './lib/createPopup';
import { useOAuthContext } from './OAuthProvider';
import {
   DefaultMappedTypes,
   Method,
   Nullable,
   PopupError,
   PopupEventResponse,
   PopupSuccess,
   PopupViewParams,
   Provider
} from './types';

interface OAuthEvents<
   TData extends Partial<DefaultMappedTypes>,
   TError extends Partial<DefaultMappedTypes>
> {
   onSuccess: (response: PopupSuccess<TData>) => Promise<void> | void;
   onError: (error: PopupError<TError>) => void;
   onOpen: (provider: Provider) => void;
   onClose: VoidFunction;
}

interface OAuthReturnType<TData extends Partial<DefaultMappedTypes>> {
   data: Nullable<PopupSuccess<TData>>;
   activeProvider: Nullable<Provider>;
   closePopup: VoidFunction;
   openPopup: (provider: Provider, popupParams?: PopupViewParams) => VoidFunction;
}

function useOAuth<
   TData extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TError extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TEvents extends Partial<OAuthEvents<TData, TError>> = Partial<
      OAuthEvents<TData, TError>
   >
>(method: Method, events?: TEvents): OAuthReturnType<TData>;

function useOAuth<
   TData extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TError extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TEvents extends Partial<OAuthEvents<TData, TError>> = Partial<
      OAuthEvents<TData, TError>
   >
>(events?: TEvents): OAuthReturnType<TData>;

function useOAuth<
   TData extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TError extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TEvents extends Partial<OAuthEvents<TData, TError>> = Partial<
      OAuthEvents<TData, TError>
   >
>(method?: Method | TEvents, events?: TEvents): OAuthReturnType<TData> {
   const opts = {
      method: typeof method === 'string' ? method : 'auth',
      events: typeof method === 'object' ? events : events
   };

   const popupRef = useRef<Nullable<Window>>(null);
   const { createWindowParams } = useOAuthContext();
   const [lastData, setLastData] = useState<Nullable<PopupSuccess<TData>>>(null);
   const [activeProvider, setActiveProvider] = useState<Nullable<Provider>>(null);
   const { onOpen, onClose, onSuccess, onError } = ((): OAuthEvents<TData, TError> => {
      function resetPopupRef() {
         popupRef.current?.close();
         popupRef.current = null;
      }

      return {
         onSuccess(response) {
            resetPopupRef();
            opts.events?.onClose?.();
            Promise.resolve(events?.onSuccess?.(response)).finally(() => {
               setActiveProvider(null);
               setLastData(response);
            });
         },
         onError(error) {
            resetPopupRef();
            setActiveProvider(null);
            opts.events?.onError?.(error);
         },
         onOpen(provider) {
            setActiveProvider(provider);
            opts.events?.onOpen?.(provider);
         },
         onClose() {
            resetPopupRef();
            setActiveProvider(null);
            opts.events?.onClose?.();
         }
      };
   })();

   function generateState() {
      const randomString = uuid_v4().replace(/-/g, '');
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
            opts.method,
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
      function messageHandler({ data }: MessageEvent<PopupEventResponse<TData, TError>>) {
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
      activeProvider,
      data: lastData
   };
}

export { useOAuth };
