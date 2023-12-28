# React-Use-OAuth2-Popup

This small library is designed to simplify working with OAuth2 in your React applications. Authorization with a third-party service is called in a new popup window of the browser. It allows you to use multiple providers and separate the logic of interaction with third-party services (methods).
## Getting Started

To install in your project, use the following command:

```bash
npm i react-use-oauth2-popup // or yarn add react-use-oauth2-popup
```

___
## OAuthProvider

First, you need to create configurations for OAuth2 using `OAuthParams` and pass it as a `params` argument to the context provider. Create a configuration outside the component.

### Example:

```jsx
import { OAuthParams, OAuthProvider } from 'react-use-oauth2-popup'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const params = new OAuthParams({
  redirectUri: 'external/:provider/:method',
  providers: {
    google: {
      url: {
        base_path: 'https://accounts.google.com/o/oauth2/v2/auth',
        client_id: process.env.google_client_id,
        response_type: 'code',
        scope: ['https://www.googleapis.com/auth/userinfo.email']
      },
      popup: {
        height: 600,
        width: 450
      },
    },
    discord: {
      base_path: 'https://discord.com/oauth2/authorize',
      client_id: process.env.discord_client_id,
      response_type: 'code',
      scope: 'identify'
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: 'external/:provider/:method',
    element: <PopupPage />
  }
])

const App = () => {
  return (
    <OAuthProvider params={params}>
      <RouterProvider router={router} />
    </OAuthProvider>
  )
}
```
### Options:

* **`redirectUri: string`**
	- **Required**
	- This is the URL where the browser will redirect after the user authorizes access
  - The string must contain `:provider` and `:method`
  - Specifies the path to the page where the `useOAuthPopup` hook is called
* **`providers: Record<string, {url: OAuthReqParams | OAuthUrlFn, popup?: PopupViewParams}>`**
  - **Required**
  - This is an enumeration of all the providers that will be used
  - Option `popup`
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

### OAuthParams Templates

You can also use pre-defined TypeScript OAuth templates ([GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), [Discord](https://discord.com/developers/docs/topics/oauth2), [VK](https://dev.vk.com/ru/api/oauth-parameters), [Twitch](https://dev.twitch.tv/docs/authentication/), [Google](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow), [LinkedIn](https://developer.linkedin.com/blog/posts/2018/redirecting-oauth-uas), [Microsoft](https://learn.microsoft.com/ru-ru/entra/identity-platform/v2-oauth2-auth-code-flow)). Usage example:

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
After you have specified the configuration, you need to call the `useOAuth` hook on the desired page

```jsx
const {
  openPopup,
  closePopup,
  activeProvider
} = useOAuth(method, events?)
```

### Options:
* `method: string`
	* **Required**
  * This allows you to use the `credentials` handlers in the `useOAuthPopup` hook
* `events?: PopupEvents | undefined`
	* Optional 
  * An `PopupEvents` as a value: 
    * `onSuccess?: ({ provider: string, method: string, credentials: Record<string, string>, data: TData}) => Promise<void> | void`
      * Optional
      * This function will fire when the `credentials` is received and processed using the `useOAuthPopup` hook.
      * Can return a promise which will resolve the data (`activeProvider` will not change value to `null`, until the promise is resolved)
      * The `data` value contains the result of execution from the corresponding handler from `useOAuthPopup`
      * The `credentials` value contains all the parameters returned by the provider
    * `onError?: ({ provider: string, method: string, errorCode: string, error?: TError }) => void`
      * Optional
      * This function will fire when an error occurs during the process
      * The `error` is not empty only if the error was returned by the handler from the `useOAuthPopup` hook or if the provider returned an error.
      * `errorCode` will be
        * ***State Mismatch*** - The state value returned after receiving the credentials does not match
        * ***Callback Error*** - The function passed to process the method in the `useOAuthPopup` hook failed with an error
        * ***Invalid Parameters*** - An invalid `provider` is specified or an error has been made in `redirect_uri`
        * ***Callback Not Found*** - The `useOAuthPopup` hook does not have a handler for this method or a default handler
        * ***FailureResponse*** - The `provider` returned an error
    * `onOpen?: () => void`
      * Optional
      * This function will fire when a popup opens
    * `onClose?: () => void`
      * Optional
      * This function will fire when a popup closes

### Returns:
* `openPopup: (provider: string) => () => void`
	* Function for invoking the popup
* `closePopup: () => void`
  * Function to close the popup
  * If the popup is already closed, but the `onSuccess` event has not yet been executed, the `onSuccess` event will not be interrupted
* `activeProvider: string | null`
	* Name of the current popup provider
  * It will keep its value until the `onSuccess` is executed

### Example:

```jsx
import { useOAuth, errorCodes } from 'react-use-oauth2-popup'
import { redirect } from "react-router-dom";

const LoginPage = () => {
  const { openPopup } = useOAuth('login', {
	onSuccess: ({ data }) => {
            redirect('me/profile')
	}, 
	onError: ({errorCode}) => {
            switch(errorCode){
		case errorCodes.StateMismatch:
		     //notification: try again
	   }
	}
  })
  
  return (
    <button onClick={openPopup('discord')}>
      Login with Discord
    </button>
  )
}
```

___
## useOAuthPopup
The hook should be called on the page specified in the "redirectUri". After receiving the `credentials` from the provider, this page will be opened and the appropriate handler method will be called. 

After processing the data, the `popup` will be closed automatically, even if an error occurs.
```jsx
const {
  status,
  isIdle,
  isRunning,
  isError,
  isSuccess
} = useOAuthPopup(handlers, options?)
```

### Options:

* `handlers: Record<string, (data: { method: string, provider: string, credentials: Record<string, string> }) => Promise<unknown> | unknown>`
* `handlers: (data: { method: string, provider: string, credentials: Record<string, string> }) => Promise<unknown> | unknown`
	* **Required**
  * *Recommendation: use it to send `credentials` to the backend of the application*
  * If `multiple` handlers: 
    * You can specify a `default` handler that will be called if there is no handler for a specific method
    * The key for each handler is the `method` that you specified in the `useOAuth` hook
* `options: PopupConfig | undifined`
  * Optional
  * An `PopupConfig` as a value:
    * `directAccessHandler: (() => void) | undefined`
      * Optional
      * This function will fire when the page is opened manually
      * Default to `() => window.location.assign(window.location.origin)`
    * `delayClose: number | undefined`
      * Optional
      * Defines the delay in milliseconds before closing the `popup` for any outcome
      * Default to `0`

### Returns:
* `status: string`
  * Will be:
    * `idle` The initial state. Does not change if the page is opened manually
    * `running` If it processes the received data
    * `success` If the data has been processed successfully
    * `error` If the data has been processed unsuccessfully
  * `isIdle: boolean` 
    * A derived boolean from the `status` variable above, provided for convenience
  * `isRunning: boolean`
    * A derived boolean from the `status` variable above, provided for convenience
  * `isError: boolean` 
    * A derived boolean from the `status` variable above, provided for convenience
  * `isSuccess: boolean`
    * A derived boolean from the `status` variable above, provided for convenience

### Example: 
```jsx 
import { useOAuthPopup } from 'react-use-oauth2-popup'

const PopupPage = () => {
  const { isRunning, isSuccess, isError } = useOAuthPopup({
    login: async ({ credentials }) => {
      const res = await fetch('example.com/login', {
        method: 'post',
        body: JSON.stringify(credentials)
      })
      return res.json()
    },
    default: () => {
      console.log('No method specified')
    }
  })
	
  if(isRunning){
    return <LoaderIcon />
  }
  
  if(isSuccess){
    return <SuccessIcon />
  }
  
  if(isError){
    return <ErrorIcon />
  }
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
