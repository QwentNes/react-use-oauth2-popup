import { useEffect } from 'react'
import {
  CallbackError,
  CallbackNotFound,
  InvalidParameters,
  StateMismatch
} from './constants/errors'
import parseUrl from './lib/parseUrl'
import { useOAuthClient } from './OAuthProvider'
import { Method, MethodHandler, MethodHandlers, PopupError, PopupSuccess } from './types'

function useOAuthPopup(handlers: MethodHandler | MethodHandlers): void {
  const { getProviderNames, getRedirectUrlPattern } = useOAuthClient()

  function getCallback(method: Method) {
    const callback =
      typeof handlers === 'object' ? handlers[method] || handlers['default'] : handlers

    if (!callback) {
      throw CallbackNotFound
    }

    return callback
  }

  function getParamsFromUrl() {
    return parseUrl(window.location.href, getRedirectUrlPattern())
  }

  function checkParams({ namedParams, queryParams }: ReturnType<typeof parseUrl>) {
    const { provider, method } = namedParams
    const { state } = queryParams

    const params = [provider, method, state]

    if (!params.every(Boolean) || !getProviderNames().includes(provider)) {
      throw InvalidParameters
    }

    const localState = window.localStorage.getItem('oauth-state')
    window.localStorage.removeItem('oauth-state')

    if (state !== localState) {
      throw StateMismatch
    }
  }

  function sendResponse(payload: PopupSuccess | PopupError) {
    window.opener.postMessage(
      {
        source: 'oauth-popup',
        result: payload.hasOwnProperty('data') ? 'success' : 'error',
        payload
      },
      location.origin
    )
  }

  useEffect(() => {
    if (!window.opener) {
      return window.location.assign(window.location.origin)
    }

    const params = getParamsFromUrl()

    try {
      checkParams(params)
      const { provider, method } = params.namedParams

      getCallback(method)?.({ method, provider, credentials: params.queryParams })
        .then((data) =>
          sendResponse({
            conditionals: params.queryParams,
            provider,
            method,
            data
          })
        )
        .catch((error) =>
          sendResponse({
            errorCode: CallbackError,
            provider,
            method,
            error
          })
        )
    } catch (error) {
      sendResponse({
        errorCode: error as string,
        method: params.namedParams?.method,
        provider: params.namedParams?.provider
      })
    }
  }, [])
}

export { useOAuthPopup }
