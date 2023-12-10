import { useEffect, useRef, useState } from 'react'
import createPopup from './lib/createPopup'
import { useOAuthClient } from './OAuthProvider'
import {
  AuthEvents,
  Method,
  PopupEventResponse,
  Provider,
  UseOAuthReturnType
} from './types'

export function useOAuth(method: Method, events?: AuthEvents): UseOAuthReturnType {
  const popupRef = useRef<Window | null>(null)
  const [variant, setVariant] = useState<Provider | null>(null)
  const { createPopupParams } = useOAuthClient()

  useEffect(() => {
    if (!popupRef?.current || popupRef.current?.closed) return

    const checkInterval = setInterval(() => {
      if (popupRef.current?.closed) {
        setVariant(null)
        events?.onClose?.()
        popupRef.current = null
      }
    }, 400)

    return () => {
      clearInterval(checkInterval)
    }
  }, [variant])

  const openPopup = (provider: Provider) => () => {
    if (variant) {
      popupRef.current?.focus()
      return
    }

    const { state, ...popupParams } = createPopupParams(provider, method)
    window.localStorage.setItem('oauth-state', state)

    popupRef.current = createPopup(popupParams)
    setVariant(provider)
    events?.onOpen?.()
  }

  const messageHandler = async ({ data }: MessageEvent) => {
    const _data: PopupEventResponse = data
    if (_data?.source !== 'oauth-popup') return

    switch (_data.result) {
      case 'success':
        if (events?.onSuccess) {
          const _ref = popupRef.current
          popupRef.current = null
          _ref?.close()
          events?.onClose?.()
          Promise.resolve(events.onSuccess(_data.payload)).finally(() => {
            popupRef.current = _ref
            setVariant(null)
          })
          return
        }
        closePopup()
        break
      case 'error':
        events?.onError?.(_data.payload)
        closePopup()
    }
  }

  const closePopup = () => {
    if (!popupRef.current?.closed) {
      popupRef.current?.close()
      events?.onClose?.()
    }
    setVariant(null)
  }

  useEffect(() => {
    window.addEventListener('message', messageHandler, false)
    return () => {
      window.removeEventListener('message', messageHandler)
      popupRef.current?.close?.()
    }
  }, [])

  return {
    openPopup,
    isInProcess: !!variant,
    activeProvider: variant
  }
}
