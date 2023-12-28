import { Method, Provider } from '../types';

function createRedirectUrl(pattern: string, provider: Provider, method: Method): string {
   const segments = pattern.split('/');
   const providerIndex = segments.findIndex((segment) => segment === ':provider');
   const methodIndex = segments.findIndex((segment) => segment === ':method');

   if (providerIndex === -1 || methodIndex === -1 || providerIndex === methodIndex) {
      throw new Error(
         "Invalid redirect_uri! The string must contain ':provider' and ':method' separated by a slash"
      );
   }

   segments[providerIndex] = provider;
   segments[methodIndex] = method;

   return new URL(segments.join('/'), window.location.origin).toString();
}

export default createRedirectUrl;
