import { PopupParams } from '../types';
import Helpers from './helpers';

function createPopup({
   url,
   title,
   position,
   width = 450,
   height = 600
}: PopupParams): Window | null {
   let top = window.screenY + (window.outerHeight - height) / 2.5;
   let left = window.screenX + (window.outerWidth - width) / 2;

   if (Helpers.IsObject(position)) {
      top = position?.topOffset || top;
      left = position?.leftOffset || left;
   }

   return window.open(
      url,
      title,
      `popup,resizable,scrollbars,status,width=${width},height=${height},left=${left},top=${top}`
   );
}

export default createPopup;
