import { UrlNamedParams, UrlQueryParams } from '../types'

const parseUrl = (urlValue: string, urlPattern: string) => {
  const urlBase = new URL(urlValue)

  function hash() {
    return urlBase.hash.substring(1)
  }

  function namedParams() {
    const allPathName = pathNames()
    const allNamedParamsKeys = namedParamsWithIndex()

    return allNamedParamsKeys.reduce<Record<string, string>>((values, paramKey) => {
      values[paramKey.value] = allPathName[paramKey.index]
      return values
    }, {})
  }

  function namedParamsWithIndex() {
    const namedUrlParams = getPathNames(urlPattern)

    return namedUrlParams.reduce<{ value: string; index: number }[]>(
      (validParams, param, index) => {
        if (param[0] === ':') {
          validParams.push({ value: param.slice(1), index })
        }
        return validParams
      },
      []
    )
  }

  function queryParams() {
    const params: Record<string, string> = {}
    let source: URLSearchParams

    if (!(urlBase.searchParams as any).size) {
      params['from'] = 'hash'
      source = new URLSearchParams(hash())
    } else {
      params['from'] = 'query'
      source = urlBase.searchParams
    }

    source.forEach((value, key) => {
      params[key] = value
    })

    return params
  }

  function getPathNames(pathName: string) {
    if (pathName === '/' || pathName.trim().length === 0) return [pathName]
    if (pathName.slice(-1) === '/') {
      pathName = pathName.slice(0, -1)
    }
    if (pathName[0] === '/') {
      pathName = pathName.slice(1)
    }

    return pathName.split('/')
  }

  function pathNames() {
    return getPathNames(urlBase.pathname)
  }

  return Object.freeze({
    namedParams: namedParams() as UrlNamedParams,
    queryParams: queryParams() as UrlQueryParams
  })
}

export default parseUrl
