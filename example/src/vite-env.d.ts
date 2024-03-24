/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT: string
    readonly VITE_DISCORD_CLIENT: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}