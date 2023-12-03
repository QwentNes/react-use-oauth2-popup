import { PopupParams } from '../types'

function createPopup({
  url,
  title,
  position,
  width = 450,
  height = 600
}: PopupParams): Window | null {
  let top = window.screenY + (window.outerHeight - height) / 2.5
  let left = window.screenX + (window.outerWidth - width) / 2

  if (typeof position === 'object') {
    top = position?.topOffset || top
    left = position?.leftOffset || left
  }

  return window.open(
    url,
    title,
    `popup,resizable,scrollbars,status,width=${width},height=${height},left=${left},top=${top}`
  )
}

export default createPopup
