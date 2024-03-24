import {ErrorCodes, useOAuth} from "react-use-oauth2-popup";
import {PopupError, PopupSuccess} from "./types.ts";

const AuthPage = () => {
    const { openPopup, closePopup, activeProvider } = useOAuth<PopupSuccess, PopupError>('auth', {
        onSuccess(response) {
            switch (response.provider){
                case 'google':
                    console.log('google profile', response.details)
                    break
                case 'discord':
                    console.log('discord profile', response.details)
            }
        },
        onError(error) {
            switch (error.code){
                case ErrorCodes.CallbackError:
                    console.log('callback error !', error.details.message);
                    break;
                default:
                    console.log('try again')
            }
        },
        onOpen(provider) {
            console.log('process auth with', provider)
        },
        onClose() {
            console.log('popup closed !')
        }
    })

    return (
        <div>
            <h3>Auth with social</h3>
            <div>
                <button onClick={openPopup('google')}>
                    Google
                </button>
                <button onClick={openPopup('discord')}>
                    Discord
                </button>
            </div>
            <button onClick={closePopup}>
                close popup
            </button>
            <span>current: {activeProvider}</span>
        </div>
    )
}

export default AuthPage