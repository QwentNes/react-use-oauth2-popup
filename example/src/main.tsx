import ReactDOM from 'react-dom/client'
import {OAuthParams, OAuthProvider} from "react-use-oauth2-popup";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import AuthPage from "./auth";
import PopupPage from './popup';

const REDIRECT_URI = '/external/:provider/:method'

const params = new OAuthParams(REDIRECT_URI, (templates) => ({
    google: templates.google({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT,
        response_type: 'code',
        prompt: 'select_account',
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ]
    }),
    discord: templates.discord({
        client_id: import.meta.env.VITE_DISCORD_CLIENT,
        response_type: 'code',
        prompt: 'consent',
        scope: ['guilds', 'email', 'identify']
    })
}))

const router = createBrowserRouter([
    {
        path: '/',
        element: <AuthPage/>
    },
    {
        path: REDIRECT_URI,
        element: <PopupPage/>
    }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
    <OAuthProvider params={params}>
        <RouterProvider router={router}/>
    </OAuthProvider>,
)
