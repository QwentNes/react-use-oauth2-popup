import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { OAuthProvider, OAuthStatus, useOAuth } from '../src';
import { SOURCE_KEY } from '../src/constants/common';
import params from './__mocks__/params';

const events = {
   onSuccess: jest.fn(),
   onError: jest.fn(),
   onOpen: jest.fn(),
   onClose: jest.fn()
};

const realOpen = global.open;

let openMock: jest.SpyInstance = jest.fn();

beforeEach(() => {
   openMock = jest
      .spyOn(global, 'open')
      //@ts-ignore
      .mockImplementation((url: string) => ({
         close: () => {},
         closed: false
      }));
});

test('should-call-events', () => {
   const { result, unmount } = renderHook(() => useOAuth('auth', events), {
      wrapper: ({ children }: { children: React.ReactElement } & any) => {
         return <OAuthProvider params={params}>{children}</OAuthProvider>;
      }
   });

   act(() => {
      result.current.openPopup('google')();
   });

   expect(openMock).toHaveBeenCalledTimes(1);
   expect(events.onOpen).toHaveBeenCalledTimes(1);
   expect(events.onOpen).toHaveBeenCalledWith('google');

   act(() => {
      result.current.closePopup();
   });

   expect(events.onClose).toHaveBeenCalledTimes(1);

   act(() => {
      result.current.openPopup('google')();
   });

   expect(openMock).toHaveBeenCalledTimes(2);
   expect(events.onOpen).toHaveBeenCalledWith('google');

   act(() => {
      window.dispatchEvent(
         new MessageEvent('message', {
            data: {
               source: SOURCE_KEY,
               result: OAuthStatus.success,
               payload: {}
            },
            origin: window.location.origin
         })
      );
   });

   expect(events.onSuccess).toHaveBeenCalledTimes(1);

   act(() => {
      window.dispatchEvent(
         new MessageEvent('message', {
            data: {
               source: SOURCE_KEY,
               result: OAuthStatus.error,
               payload: {}
            },
            origin: window.location.origin
         })
      );
   });

   expect(events.onError).toHaveBeenCalledTimes(1);

   unmount();
});

afterAll(() => {
   global.open = realOpen;
});
