import {DangerDSLType} from 'danger'

// Disallow a file extenstion in the selected dirs
export const squashMigrations = (params: {
  danger: DangerDSLType
  hasuraMigrationsPath: Array<string>
  maxMigrationsLimit: number
  warn: (message: string) => void
}) => {
  const migrationsFiles = params.danger.git.fileMatch(`${params.hasuraMigrationsPath}/*`)

  if(!migrationsFiles.edited) {
    return
  }

  if((migrationsFiles.getKeyedPaths().edited || []).length > params.maxMigrationsLimit) {
    params.warn('Too many Hasura migrations files, consider squashing some of them')
  }
}
