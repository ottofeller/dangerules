import * as R from 'ramda'
import {DangerDSLType} from 'danger'

// Disallow a file extenstion in the selected dirs
export const codegenMissing = (params: {
  codegenFileExtension: string
  codegenPaths: Array<string>
  danger: DangerDSLType
  hasuraMigrationsPath: string
  schemaPath: string
  warn: (message: string) => void
}) => {
  const hasuraMigrationsEditedFiles = params.danger.git.fileMatch(`${params.hasuraMigrationsPath}/*`)
  const isSchemaEdited = params.danger.git.fileMatch(`${params.schemaPath}`).edited

  if(!hasuraMigrationsEditedFiles.edited) {
    return
  }

  const codegenEditedFiles = R.compose<Array<string>, Array<Array<string>>, Array<string>>(
    R.flatten,

    R.map(path => {
      const files = params.danger.git.fileMatch(`${path}/*.${params.codegenFileExtension}`)

      if(!files.edited) {
        return []
      }

      return files.getKeyedPaths().edited
    }),
  )(params.codegenPaths)

  if(R.isEmpty(codegenEditedFiles) && !isSchemaEdited) {
    params.warn('Found Hasura migrations but no changes in codegen files and schema.json')
    return
  }

  if(!isSchemaEdited) {
    params.warn('Found Hasura migrations but no changes in schema.json')
    return
  }

  if(R.isEmpty(codegenEditedFiles)) {
    params.warn('Found Hasura migrations but no changes in codegen files')
    return
  }
}
