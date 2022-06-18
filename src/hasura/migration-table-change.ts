import {DangerDSLType, MarkdownString} from 'danger'
import * as fs from 'fs'
import * as R from 'ramda'

/**
 * Searches for Hasura migrations in edited files.
 * If present, warns in case of:
 * - rename of a field;
 * - removal of a field;
 * - "not null" restrictions on the existing field.
 *
 * @param danger Danger instance
 * @param warn Danger warn function
 * @param hasuraMigrationsPath paths to Hasura migrations
 */
export const migrationTableChange = (params: {
  danger: DangerDSLType
  hasuraMigrationsPath: string
  warn: (message: MarkdownString, file?: string, line?: number) => void
}) => {
  const {danger, hasuraMigrationsPath, warn} = params
  const hasuraMigrationsFiles = danger.git.fileMatch(`${hasuraMigrationsPath}/**/*`)

  if (!hasuraMigrationsFiles.edited) {
    return
  }

  R.forEach(
    (filePath) =>
      R.compose<[string], string, string[], string[], string[], void>(
        R.forEach((statement) => {
          const isAlterTableStatement = /^ALTER TABLE/.test(statement)
          if (!isAlterTableStatement) {
            return
          }

          const isRenameColumnStatement = /RENAME COLUMN/.test(statement)
          if (isRenameColumnStatement) {
            warn('Found Hasura migration renaming a field', filePath)
            return
          }

          const isRemoveColumnStatement = /DROP COLUMN/.test(statement)
          if (isRemoveColumnStatement) {
            warn('Found Hasura migration removing a field', filePath)
            return
          }

          const isRemoveNotNullConstraint = /ALTER COLUMN .+ DROP NOT NULL/.test(statement)
          if (isRemoveNotNullConstraint) {
            warn('Found Hasura migration removing "NOT NULL" constraint', filePath)
          }
        }),
        R.map(R.compose(R.toUpper, R.trim)),
        // @ts-expect-error -- TS mistakenly identify "R.identity" type as "<T>(val: T): val is T" instead of "<T>(val: T): T"
        R.filter<string, string>(R.identity),
        R.split(';'),
        R.curryN(2, R.flip(fs.readFileSync))({encoding: 'utf-8'}),
      )(filePath),
    hasuraMigrationsFiles.getKeyedPaths().edited,
  )
}
