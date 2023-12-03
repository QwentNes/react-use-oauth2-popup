export declare type CreatePopupOptions = {
    url: string;
    title: string;
    width: number;
    height: number;
    leftOffset?: number;
    topOffset?: number;
};
export declare type PopupViewOptions = Omit<CreatePopupOptions, 'url' | 'title'>;
declare function createPopup({ width, height, title, url, topOffset, leftOffset }: CreatePopupOptions): Window | null;
export default createPopup;
