import { PopupStatus, useOAuthPopup } from "react-use-oauth2-popup";

const titles = {
    [PopupStatus.running]: 'Wait',
    [PopupStatus.idle]: 'Wait',
    [PopupStatus.error]: 'Error !',
    [PopupStatus.success]: 'Success !'
}

const PopupPage = () => {
    const { status } = useOAuthPopup(async ({provider, credentials, method}) => {
        const res = await fetch(`example.com/${method}/${provider}`, {
            method: 'post',
            body: JSON.stringify(credentials)
        })
        return res.json()
    }, {
        delayClose: 2000,
    })

    return <div>{titles[status]}</div>
}

export default PopupPage