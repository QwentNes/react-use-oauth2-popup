import { JSX, ReactNode } from 'react';
import { ErrorCodes, SOURCE_KEY } from '../constants/common';
import templates from '../constants/templates';
import { OAuthParams } from '../OAuthProvider';
import { PreservedValue } from './helpers';
import { OAuthHookTypes } from './options';

export type Method = PreservedValue<OAuthHookTypes['method'], string>;
export type Provider = PreservedValue<OAuthHookTypes['provider'], string>;
export type OAuthErrorCodes = (typeof ErrorCodes)[keyof typeof ErrorCodes];
export type DefaultMappedTypes = Record<Provider, unknown>;
export type OAuthTemplates = typeof templates;

export enum PopupStatus {
   idle = 'idle',
   running = 'running',
   success = 'success',
   error = 'error'
}

export enum OAuthStatus {
   success = 'success',
   error = 'error'
}

export type OAuthContextProviderProps = {
   children: ReactNode;
   params: OAuthParams;
};

export type OAuthContextProvider = (props: OAuthContextProviderProps) => JSX.Element;

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

export type MethodHandler = (data: HandlerData) => Promise<unknown> | unknown;

export type MethodHandlers =
   | {
        [key in Method]: MethodHandler;
     }
   | ({ [key in Method]?: MethodHandler } & {
        default: MethodHandler;
     });

export type HandlerData = {
   credentials: UrlQueryParams;
} & UrlNamedParams;

export type UrlNamedParams = {
   provider: Provider;
   method: Method;
};

export type UrlQueryParams = {
   from: 'hash' | 'query';
   state: string;
} & Record<string, string>;

export type PopupEventResponse<
   TData extends Partial<DefaultMappedTypes>,
   TError extends Partial<DefaultMappedTypes>
> = { source: typeof SOURCE_KEY } & (
   | {
        result: OAuthStatus.success;
        payload: PopupSuccess<TData>;
     }
   | {
        result: OAuthStatus.error;
        payload: PopupError<TError>;
     }
);

export type PopupError<TError extends Partial<DefaultMappedTypes>> =
   | (Partial<UrlNamedParams> &
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
                code: Exclude<OAuthErrorCodes, 'Failure Response' | 'Callback Error'>;
             }
        ))
   | ({
        method: Method;
        code: Extract<OAuthErrorCodes, 'Callback Error'>;
     } & {
        [K in keyof DefaultMappedTypes]: {
           provider: K;
           details: PreservedValue<TError[K], unknown>;
        };
     }[keyof DefaultMappedTypes]);

export type PopupSuccess<TData extends Partial<DefaultMappedTypes>> = {
   [P in keyof DefaultMappedTypes]: {
      provider: P;
      details: PreservedValue<TData[P], unknown>;
   };
}[keyof DefaultMappedTypes] & {
   credentials: UrlQueryParams;
   method: Method;
};

export { Nullable } from './helpers';
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
