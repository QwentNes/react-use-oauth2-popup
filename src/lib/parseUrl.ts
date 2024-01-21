import { UrlNamedParams, UrlQueryParams } from '../types';

const parseUrl = (urlValue: string, uriPattern: string) => {
   const urlBase = new URL(urlValue);

   function hash() {
      return urlBase.hash.substring(1);
   }

   function pathname() {
      return urlBase.pathname;
   }

   function searchParams() {
      return urlBase.searchParams;
   }

   function namedParams() {
      const allPathName = getPathNames(pathname());
      const allNamedParamsKeys = namedParamsWithIndex();

      return allNamedParamsKeys.reduce<Record<string, string>>((values, paramKey) => {
         values[paramKey.value] = allPathName[paramKey.index];
         return values;
      }, {});
   }

   function namedParamsWithIndex() {
      const namedUrlParams = getPathNames(uriPattern);

      return namedUrlParams.reduce<{ value: string; index: number }[]>(
         (validParams, param, index) => {
            if (param[0] === ':') {
               validParams.push({ value: param.slice(1), index });
            }
            return validParams;
         },
         []
      );
   }

   function queryParams() {
      const params: Record<string, string> = {};
      let source: URLSearchParams;

      if (!(searchParams() as any).size) {
         params['from'] = 'hash';
         source = new URLSearchParams(hash());
      } else {
         params['from'] = 'query';
         source = searchParams();
      }

      source.forEach((value, key) => {
         params[key] = value;
      });

      return params;
   }

   function getPathNames(pathName: string) {
      if (pathName === '/' || pathName.trim().length === 0) return [pathName];
      if (pathName.slice(-1) === '/') {
         pathName = pathName.slice(0, -1);
      }
      if (pathName[0] === '/') {
         pathName = pathName.slice(1);
      }

      return pathName.split('/');
   }

   return Object.freeze({
      namedParams: namedParams() as UrlNamedParams,
      queryParams: queryParams() as UrlQueryParams
   });
};

export default parseUrl;
