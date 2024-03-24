// import the original type declarations
import 'react-use-oauth2-popup'

declare module 'react-use-oauth2-popup' {
    // Extend CustomTypeOptions
    interface CustomTypeOptions {
        provider: 'google' | 'discord'
        method: 'auth'
    }
}