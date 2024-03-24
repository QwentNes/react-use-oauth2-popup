import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { OAuthProvider, useOAuth } from '../src';
import params from './__mocks__/params';

const testCases = [
   { name: 'provider1', host: 'oauth.server1.com' },
   { name: 'provider2', host: 'server2.com' },
   { name: 'google', host: 'accounts.google.com' }
];

const realOpen = global.open;

let openMock: jest.SpyInstance = jest.fn();
let closePopupMock: jest.Mock = jest.fn();

beforeEach(() => {
   openMock = jest
      .spyOn(global, 'open')
      //@ts-ignore
      .mockImplementation((url: string) => ({
         location: {
            origin: new URL(url).origin,
            host: new URL(url).host,
            searchParams: new URL(url).searchParams
         },
         close: closePopupMock,
         closed: false
      }));
});

afterEach(() => {
   jest.resetAllMocks();
});

test.each(testCases)('Should invoke required provider ($name)', ({ name, host }) => {
   const { result, unmount } = renderHook(() => useOAuth('auth'), {
      wrapper: ({ children }: { children: React.ReactElement } & any) => {
         return <OAuthProvider params={params}>{children}</OAuthProvider>;
      }
   });

   expect(result.current.activeProvider).toBeNull();

   act(() => {
      result.current.openPopup(name)();
   });

   expect(result.current.activeProvider).toBe(name);
   expect(openMock).toHaveBeenCalledTimes(1);

   const callLocation = openMock.mock.results[0].value.location;
   expect(callLocation.host).toBe(host);
   expect(callLocation.searchParams.get('redirect_uri')).toBe(
      `${window.location.origin}/external/${name}/auth`
   );

   act(() => {
      result.current.closePopup();
   });

   expect(closePopupMock).toHaveBeenCalled();
   expect(result.current.activeProvider).toBeNull();

   unmount();
});

afterAll(() => {
   global.open = realOpen;
});
