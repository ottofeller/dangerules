import * as R from 'ramda'
import {DangerDSLType} from 'danger'

/**
 * Searches for Hasura migrations in edited files.
 * If present, warns in ccase of no changes in codegen files and `schema.json`.
 * 
 * @param danger Dnager instance
 * @param warn Danger warn function
 * @param hasuraMigrationsPath paths to Hasura migrations
 * @param codegenPaths paths to codegen files
 * @param schemaPath path to `schema.json` file
 * @param codegenFileExtension codegen file extension
 */
export const codegenMissing = (params: {
  codegenFileExtension: string
  codegenPaths: Array<string>
  danger: DangerDSLType
  hasuraMigrationsPath: string
  schemaPath: string
  warn: (message: string) => void
}) => {
  const hasuraMigrationsEditedFiles = params.danger.git.fileMatch(`${params.hasuraMigrationsPath}/**/*`).edited
  const isSchemaEdited = params.danger.git.fileMatch(`${params.schemaPath}`).edited

  if(!hasuraMigrationsEditedFiles) {
    return
  }

  const codegenEditedFiles = R.compose<Array<string>, Array<Array<string>>, Array<string>>(
    R.flatten,

    R.map(path => {
      const files = params.danger.git.fileMatch(`${path}/**/*.${params.codegenFileExtension}`)

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
