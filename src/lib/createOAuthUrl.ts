import { OAuthReqParams } from '../types';

function createOAuthUrl(
   basePath: string,
   { response_type, other_params, ...rest }: OAuthReqParams
): string {
   const url = new URL(basePath);

   url.searchParams.set('response_type', response_type || 'code');
   Object.entries({ ...other_params, ...rest }).forEach(([key, value]) => {
      url.searchParams.set(
         key,
         (Array.isArray(value) ? value.join(' ') : value) as string
      );
   });

   return url.toString();
}

export default createOAuthUrl;
