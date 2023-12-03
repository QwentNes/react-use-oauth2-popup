import React, { createContext, useContext } from 'react'
import { OAuthParams } from './OAuthParams'
import { OAuthContextProvider } from './types'

const OAuthParamsContext = createContext<OAuthParams | undefined>(undefined)

export const useOAuthClient = () => {
  const client = useContext(OAuthParamsContext)

  if (!client) {
    throw new Error('No OAuthClient set, use OAuthProvider to set one')
  }

  return client!
}

export const OAuthProvider: OAuthContextProvider = ({ children, params }) => {
  return (
    <OAuthParamsContext.Provider value={params}>{children}</OAuthParamsContext.Provider>
  )
}
