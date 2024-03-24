import { useEffect, useRef, useState } from 'react';
import { v4 as uuid_v4 } from 'uuid';
import { SOURCE_KEY, STORAGE_STATE_KEY } from './constants/common';
import createPopup from './lib/createPopup';
import Helpers from './lib/helpers';
import { useOAuthContext } from './OAuthProvider';
import {
   DefaultMappedTypes,
   Method,
   Nullable,
   OAuthStatus,
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
   /**
    * Called upon successful retrieval of credentials from the provider
    * and successful execution of the handler in the useOAuthPopup hook.
    *
    * Can return a promise which will resolve the data
    * (`activeProvider` will not change value to null, until the promise is resolved)
    *
    * ```tsx
    *
    * onSuccess(response){
    *    console.log('result', response.details);
    * };
    *
    * ```
    *
    * `response` an object containing the response data with the following properties:
    * - `method`: method name
    * - `provider`: provider name
    * - `details`: result of execution from the corresponding handler from `useOAuthPopup`
    * - `credentials`: all the parameters returned by the provider
    */
   onSuccess: (response: PopupSuccess<TData>) => Promise<void> | void;

   /**
    * This function will fire when an error occurs during the process
    *
    * ```tsx
    *
    * import { ErrorCodes } from 'react-use-oauth2-popup';
    *
    * onError(error) {
    *    switch (error.code) {
    *       case ErrorCodes.StateMismatch:
    *          break;
    *
    *       case ErrorCodes.CallbackError:
    *          // error from the `useOAuthPopup` handler
    *          console.log('error', error.details);
    *          break;
    *
    *       case ErrorCodes.InvalidParameters:
    *          break;
    *
    *       case ErrorCodes.FailureResponse:
    *          // error was returned by the provider
    *          console.log('error', error.details);
    *    }
    * }
    *
    * ```
    *
    * The `details` are not empty only if the error was returned by the handler
    * from the `useOAuthPopup` hook or if the provider returned an error.
    *
    *
    * `error` an object containing the error data with the following properties:
    * - `method`: method name
    * - `provider`: provider name
    * - `code`: error code
    * - `details`: not empty only if the error was returned by the handler from the useOAuthPopup hook or if the provider returned an error
    *
    * `codes` will be:
    * - State Mismatch - The state value returned after receiving the credentials does not match
    * - Callback Error - The function passed to process the method in the `useOAuthPopup` hook failed with an error
    * - Invalid Parameters - An invalid `provider` is specified or an error has been made in `redirect_uri`
    * - Failure Response - The `provider` returned an error
    * */
   onError: (error: PopupError<TError>) => void;

   /**
    * This function will fire when a popup opens
    *
    * provider: name of the provider whose popup is being called at this moment
    * */
   onOpen: (provider: Provider) => void;

   /**
    * This function will fire when a popup closes
    * */
   onClose: VoidFunction;
}

interface OAuthReturnType {
   /**
    * The name of the provider of the current popup
    *
    * If popup is closed, then `activeProvider` is null
    *
    * It will keep its value until the `onSuccess` event is executed
    */
   activeProvider: Nullable<Provider>;

   /**
    * Function to close the popup
    *
    * If the popup window is already closed, but the `onSuccess` event
    * is already in progress, then `onSuccess` will not be interrupted
    */
   closePopup: VoidFunction;

   /**
    * Function for invoking the popup
    *
    * If the popup is already open, then calling this function will focus the open popup
    *
    * ```tsx
    *  <button onClick={openPopup('discord')}>Login with Discord</button>
    * ```
    *
    * provider: the name of the provider to call in the popup
    *
    * popupParams?: optional, options for displaying popup
    * */
   openPopup: (provider: Provider, popupParams?: PopupViewParams) => VoidFunction;
}

/**
 * The `useOAuth` hook implements the logic of controlling and calling popup
 *
 * Specify the `method` in order to use the handler in `useOAuthPopup`
 *
 * ```tsx
 * const {
 *   openPopup,
 *   closePopup,
 *   activeProvider
 * } = useOAuth(method, events?)
 * ```
 *
 * Example:
 * ```tsx
 * import { useOAuth } from 'react-use-oauth2-popup';
 *
 * export const LoginPage = () => {
 *    const { openPopup } = useOAuth('login', {
 *       onSuccess(response){
 *          console.log('success auth' response.details);
 *       },
 *       onError(error){
 *          console.log('error', error.code);
 *       },
 *       onOpen(provider){
 *          console.log('popup open', provider);
 *       },
 *       onClose(){
 *          console.log('popup close');
 *       }
 *    });
 *
 *    return (
 *       <div>
 *          <button onClick={openPopup('discord')}>Login with Discord</button>
 *          <button onClick={openPopup('google')}>Login with Google</button>
 *       </div>
 *    );
 * };
 * ```
 *
 * To enhance the typing of the returned values for details in both
 * `success` and `error` cases, it is recommended to use generics
 *
 * *Recommendation: To strictly specify the lists of available `methods` and `providers`,
 * use the extension of the definition of `CustomTypeOptions`*
 *
 * ```tsx
 * import { useOAuth } from 'react-use-oauth2-popup';
 * import { DiscordSuccess, GoogleSuccess, DiscordError, GoogleError } from 'types'
 *
 * type Success = {
 *    discord: DiscordSuccess;
 *    google: GoogleSuccess;
 * };
 *
 * type Error = {
 *    discord: DiscordError,
 *    google: GoogleError
 * }
 *
 * useOAuth<Success, Error>()
 * ```
 */
function useOAuth<
   TData extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TError extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TEvents extends Partial<OAuthEvents<TData, TError>> = Partial<
      OAuthEvents<TData, TError>
   >
>(method: Method, events?: TEvents): OAuthReturnType;

/**
 * The `useOAuth` hook implements the logic of controlling and calling popup
 *
 * If `method` is not specified, then `useOAuthPopup` will use the `default` handler
 *
 * ```tsx
 * const {
 *   openPopup,
 *   closePopup,
 *   activeProvider
 * } = useOAuth(events?)
 * ```
 *
 * Example:
 * ```tsx
 * import { useOAuth } from 'react-use-oauth2-popup';
 *
 * export const LoginPage = () => {
 *    const { openPopup } = useOAuth({
 *       onSuccess(response){
 *          console.log('success auth' response.details);
 *       },
 *       onError(error){
 *          console.log('error', error.code);
 *       },
 *       onOpen(provider){
 *          console.log('popup open', provider);
 *       },
 *       onClose(){
 *          console.log('popup close');
 *       }
 *    });
 *
 *    return (
 *       <div>
 *          <button onClick={openPopup('discord')}>Login with Discord</button>
 *          <button onClick={openPopup('google')}>Login with Google</button>
 *       </div>
 *    );
 * };
 * ```
 *
 * To enhance the typing of the returned values for details in both
 * `success` and `error` cases, it is recommended to use generics
 *
 * *Recommendation: To strictly specify the lists of available `methods` and `providers`,
 * use the extension of the definition of `CustomTypeOptions`*
 *
 * ```tsx
 * import { useOAuth } from 'react-use-oauth2-popup';
 * import { DiscordSuccess, GoogleSuccess, DiscordError, GoogleError } from 'types'
 *
 * type Success = {
 *    discord: DiscordSuccess;
 *    google: GoogleSuccess;
 * };
 *
 * type Error = {
 *    discord: DiscordError,
 *    google: GoogleError
 * }
 *
 * useOAuth<Success, Error>()
 * ```
 */
function useOAuth<
   TData extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TError extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TEvents extends Partial<OAuthEvents<TData, TError>> = Partial<
      OAuthEvents<TData, TError>
   >
>(events?: TEvents): OAuthReturnType;

function useOAuth<
   TData extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TError extends Partial<DefaultMappedTypes> = DefaultMappedTypes,
   TEvents extends Partial<OAuthEvents<TData, TError>> = Partial<
      OAuthEvents<TData, TError>
   >
>(method?: Method | TEvents, events?: TEvents): OAuthReturnType {
   const opts = {
      method: Helpers.IsString(method) ? method : 'default',
      events: Helpers.IsObject(method) ? method : events
   };

   const popupRef = useRef<Nullable<Window>>(null);
   const { createWindowParams } = useOAuthContext();
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
      window.localStorage.setItem(STORAGE_STATE_KEY, randomString);

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
         if (popupRef.current) {
            onOpen(provider);
         }
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

      return () => clearInterval(checkInterval);
   }, [activeProvider]);

   useEffect(() => {
      //@ts-ignore (bug microbundle - message event generic)
      function messageHandler({ data }: MessageEvent<PopupEventResponse<TData, TError>>) {
         const { result, payload, source } = data || {};
         if (source === SOURCE_KEY) {
            result === OAuthStatus.success ? onSuccess(payload) : onError(payload);
         }
      }

      window.addEventListener('message', messageHandler, false);
      return () => {
         window.removeEventListener('message', messageHandler, false);
         closePopup();
      };
   }, []);

   return {
      closePopup,
      openPopup,
      activeProvider
   };
}

export { useOAuth };
