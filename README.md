# React-Use-OAuth2-Popup

This library is designed to simplify the OAuth2 authentication integration process in React applications using a popup window. It is easy to use, offering two hooks and one context provider. Additionally, it supports multiple providers and separation of interaction logic.

## Getting Started

To install in your project, use the following command:

```bash
npm i react-use-oauth2-popup // or yarn add react-use-oauth2-popup
```

___
## OAuthProvider

First, you need to create configurations for oauth using `OAuthParams` and pass it as a `params` argument to the context provider.

```jsx
import { OAuthParams, OAuthProvider } from 'react-use-oauth2-popup'

const params = new OAuthParams({
  redirectUri,
  providers,
})

const App = ({children}) => {
  return (
    <OAuthProvider params={params}>
      {children}
    </OAuthProvider>
  )
}
```
### Options:

* **`redirectUri: RedirectUri | string`**
	- **Required**
	- This is the URL where the browser will redirect after the user authorizes access
  - An `RedirectUri` as a value:
    - `pathname: string`
      - **Required**
      - The string must contain `:provider` and `:method`
      - Specifies the path to the page where the `useOAuthPopup` hook is called
    - `origin?: string | undefined`
      - Optional
      - Similar to the origin of the URL
      - Defaults to `window.location.origin`
  - An `string` as a value 
    - **Required**
    - Similar to `pathname`
* **`providers: Record<string, {url: OAuthReqParams | OAuthUrlFn, popup?: PopupViewParams}>`**
  - **Required**
  - This is an enumeration of all the providers that will be used
  - Option `url`
    - An `OAuthReqParams` as a value
	    - Creates a link based on the specified parameters
      - Note that `state` and `redirect_uri` will be added automatically
      - Must be: 
        - `base_path: string`
          - **Required**
          - Authorization server URL
        - `client_id: string`
          - **Required**
          - Public identifier for the app
        - `scope?: string | string[] | undefined`
          - Optional
          - The request may have one or more scope values indicating additional access requested by the application
        - `response_type?: 'code' | 'token' | undefined`
          - Optional
          - Defines response type after authentication
          - Default to `code`
        - `other_params?: Record<string, string | string[] | number[] | boolean> | undefined`
          - Optional
          - Lists any parameters that will be included in the URL `name=value`
    - An `OAuthLinkFn` as a value
      - Manual version of the link compilation
      - Must be:
        - `(redirect_uri: string, state: string) => string`
      - Example:
```jsx
const params = new OAuthParams({
  redirectUri: `external/:method/:provider`,
  providers: {
    google: {
      url: (redirect_uri, state) => `https://base-path.com?redirect_uri=${redirect_uri}&state=${state}&....`,
      popup: { ... }
    }
  },
})
```
- `popup?: PopupViewParams | undefined`
	- Optional
	- Allows you to customize the settings of the popup window
	- An `RedirectUriParams` as a value:
		- `width?: number | undefined`
			- Optional
			- Defines the width of the popup
			- Defaults to `450px`
		- `height?: number | undefined`
			- Optional
			- Defines the height of the popup
			- Defaults to `600px`
		- `position?: 'center' | {leftOffset?: number, topOffset?: number} | undefined`
			- Optional
			- Defines the position of the popup
			- Defaults to `center`

### OAuthParams Templates

You can also use pre-defined TypeScript OAuth templates ([GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), [Discord](https://discord.com/developers/docs/topics/oauth2), [VK](https://dev.vk.com/ru/api/oauth-parameters), [Twitch](https://dev.twitch.tv/docs/authentication/), [Google](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)). Usage example:

```jsx
const params = new OAuthParams((templates) => ({
  redirectUri: `external/:provider/:method`,
  providers: {
    google: templates.google({
      client_id: process.env.google_client_id,
      response_type: 'code',
      include_granted_scopes: true,
      scope: [...scopes]
    }),
    discord: templates.discord({
      client_id: process.env.discord_client_id,
      response_type: 'code',
      prompt: 'consent',
      scope: [...scopes]
    }),
  }
}))
```

___
## useOAuth

Allows you to open a popup and monitor the authorization status.

```jsx
const {
  openPopup,
  isInProcess,
  activeProvider
} = useOAuth(method?, events?)
```

### Options:
* `method?: string | undefined`
	* Optional
  * If necessary, it allows you to use different `credentials` handlers in the `useOAuthPopup` hook
  * Default to `auth`
* `events?: PopupEvents | undefined`
	* Optional 
  * An `PopupEvents` as a value: 
    * `onSuccess?: ({ provider: string, method: string, credentials: Record<string, string>, data: CallbackData}) => Promise<void> | void`
      * Optional
      * Can return a promise which will resolve the data (`activeProvider` and `isInProcess` will not change their values to `null` and `false`, respectively, until the promise is resolved)
    * `onError?: ({ provider: string, method: string, errorCode: string, error?: unknown }) => void`
      * Optional
      * This function will fire when an error occurs during the process
      * `statusCode` will be
        * ***State Mismatch*** - The state value returned after receiving the credentials does not match
        * ***Callback Error*** - The function passed to process the method in the `useOAuthPopup` hook failed with an error
        * ***Invalid Parameters*** - An invalid `provider` is specified or an error has been made in `redirect_uri`
        * ***Callback Not Found*** - The `useOAuthPage` hook does not have a handler for this method or a default handler
    * `onOpen?: () => void`
      * Optional
      * This function will fire when a popup opens
    * `onClose?: () => void`
      * Optional
      * This function will fire when a popup closes

### Returns:
* `openPopup: (provider: string) => () => void`
	* Function for invoking the popup
* `activeProvider: string | null`
	* Name of the current popup provider
* `isInProcess: boolean`
	* Will be `true` if the popup is open or the `onSuccess` function is not completed

### Example:

```jsx
import { useOAuth, errorCodes } from 'react-use-oauth2-popup'

const LoginPage = () => {
  const { openPopup } = useOAuth('login', {
	onSuccess: async ({ data }) => {
	// code...
	}, 
	onError: ({errorCode}) => {
	   switch(errorCode){
		case errorCodes.StateMismatch:
		     //code...
	   }
	}
  })
  
  return (
    <button onClick={() => openPopup('discord')}>
      login with discord
    </button>
  )
}
```

___
## useOAuthPopup
The hook should be called on the page specified in the `redirect_uri`. After receiving credentials from the provider, that page will be opened. If the page was opened manually, the browser will redirect to `window.location.origin`.

```jsx
import { useOAuthPopup } from 'react-use-oauth2-popup'

const Popup = () => {
  useOAuthPopup(handlers)
  
  return <LoaderIcon />
}
```

### Options:

* `handlers: Record<string, (data: { method: string, provider: string, credentials: Record<string, string> }) => Promise<unknown> | unknown>`
* `handlers: (data: { method: string, provider: string, credentials: Record<string, string> }) => Promise<unknown> | unknown`
	* **Required**
  * Use it to send `creditionals` to the backend of the application
  * If `multiple` handlers, then you can specify a `default` handler that will be called if there is no handler for a specific method

### Example: 
```jsx 
import { useOAuthPopup } from 'react-use-oauth2-popup'

const Popup = () => {
  useOAuthPopup({
    login: async ({ credentials }) => {
      const res = await fetch('example.com/login', {
        method: 'post',
        body: JSON.stringify(credentials)
      })
      return res.json()
    },
    default: () => {
      //code...
    }
  })
  // or
  useOAuthPopup(() => {
	// code...    
  })
	
  return <LoaderIcon /> 
}
  ```

___
## TypeScript
TypeScript's definitions can be extended by using. So the first step is creating a declaration file `oauth.d.ts`, for example: 

```jsx
// import the original type declarations
import 'react-use-oauth2-popup'

declare module 'react-use-oauth2-popup' {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    provider: 'google' | ...
    method: 'login' | 'join' | 'connect' | ...
  }
}
```
