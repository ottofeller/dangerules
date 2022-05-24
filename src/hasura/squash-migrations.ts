import {DangerDSLType} from 'danger'

/**
 * Searches for Hasura migrations in edited files.
 * If present, warns if the quantity of migration files to be within specified limit.
 *
 * @param danger Danger instance
 * @param warn Danger warn function
 * @param hasuraMigrationsPath paths to Hasura migrations
 * @param maxMigrationsLimit maximum allowed migration files quantity
 */
export const squashMigrations = (params: {
  danger: DangerDSLType
  hasuraMigrationsPath: string
  maxMigrationsLimit: number
  warn: (message: string) => void
}) => {
  const migrationsFiles = params.danger.git.fileMatch(`${params.hasuraMigrationsPath}/**/*`)

  if (!migrationsFiles.edited) {
    return
  }

  if ((migrationsFiles.getKeyedPaths().edited || []).length > params.maxMigrationsLimit) {
    params.warn('Too many Hasura migrations files, consider squashing some of them')
  }
}
