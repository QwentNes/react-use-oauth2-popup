import { PopupViewParams, ProviderParams, TemplateArgs } from '../types'

const createTemplate =
  <T>(base_path: string) =>
  (
    { client_id, response_type, scope, ...other_params }: TemplateArgs<T>,
    popup?: PopupViewParams
  ): ProviderParams => ({
    url: {
      base_path,
      client_id,
      other_params,
      response_type,
      scope: scope || []
    },
    popup
  })

export default createTemplate
