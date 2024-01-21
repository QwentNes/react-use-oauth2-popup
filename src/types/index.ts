import { JSX, ReactNode } from 'react';
import * as errors from '../constants/errors';
import templates from '../constants/templates';
import { OAuthParams } from '../OAuthParams';
import { PreservedValue } from './helpers';
import { OAuthHookTypes } from './options';

export type Provider = PreservedValue<OAuthHookTypes['provider'], string>;
export type Method = PreservedValue<OAuthHookTypes['method'], string>;

export type OAuthContextProvider = (props: {
   children: ReactNode;
   params: OAuthParams;
}) => JSX.Element;

type OAuthTemplates = typeof templates;

export type OAuthParamsConfig =
   | ((templates: OAuthTemplates) => ProvidersParams)
   | ProvidersParams;

export type ProvidersParams = Record<Provider, ProviderParams>;
export type RedirectUriParams = {
   pattern: string;
   create: (provider: Provider, method: Method) => string;
};

export type ProviderParams = {
   url:
      | ((redirect_uri: string, state: string) => string)
      | (Omit<OAuthReqParams, 'state' | 'redirect_uri'> & { base_path: string });
   popup?: PopupViewParams;
};

export type OAuthReqParams = {
   state: string;
   scope?: string[] | string;
   client_id: string;
   redirect_uri: string;
   response_type?: 'code' | 'token';
   other_params?: Record<string, string | string[] | number[] | boolean>;
};

export type PopupParams = {
   url: string;
   title: string;
} & PopupViewParams;

export type PopupViewParams = {
   width?: number;
   height?: number;
   position?:
      | 'center'
      | {
           topOffset?: number;
           leftOffset?: number;
        };
};

export type AuthEventHandlers<D = unknown, E = unknown> = {
   onSuccess: (response: PopupSuccess<D>) => Promise<void> | void;
   onError: (error: PopupError<E>) => void;
   onOpen: (provider: Provider) => void;
   onClose: () => void;
};

export type MethodHandler = (data: HandlerData) => Promise<unknown> | unknown;

export type MethodHandlers =
   | MethodHandler
   | {
        [key in Method]: MethodHandler;
     }
   | ({ [key in Method]?: MethodHandler } & {
        default: MethodHandler;
     });

export type HandlerData = {
   credentials: UrlQueryParams;
} & UrlNamedParams;

export type PopupConfig = {
   directAccessHandler: () => void;
   delayClose: number;
};

export type UrlNamedParams = {
   provider: Provider;
   method: Method;
};

export type UrlQueryParams = {
   from: 'hash' | 'query';
   state: string;
} & Record<string, string>;

export type PopupEventResponse<D = unknown, E = unknown> = { source: 'oauth-popup' } & (
   | {
        result: 'success';
        payload: PopupSuccess<D>;
     }
   | {
        result: 'error';
        payload: PopupError<E>;
     }
);

export type PopupSuccess<D = unknown> = {
   credentials: UrlQueryParams;
   data?: D;
} & UrlNamedParams;

export type PopupError<E = unknown> = Partial<UrlNamedParams> &
   (
      | {
           code: Extract<OAuthErrorCodes, 'Failure Response'>;
           details: {
              error: string;
              error_description?: string;
              error_uri?: string;
           } & Partial<UrlQueryParams>;
        }
      | {
           code: Extract<OAuthErrorCodes, 'Callback Error'>;
           details: E;
        }
      | {
           code: Exclude<OAuthErrorCodes, 'Failure Response' | 'Callback Error'>;
        }
   );

export type OAuthErrorCodes = (typeof errors)[keyof typeof errors];

export { CustomTypeOptions } from './options';

export {
   DiscordArgs,
   GitHubArgs,
   GoogleArgs,
   TwitchArgs,
   VkontakteArgs,
   TemplateArgs,
   MicrosoftArgs
} from './templates';
