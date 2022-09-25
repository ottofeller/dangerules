import {DangerDSLType} from 'danger'
import * as R from 'ramda'

/**
 * Checks all @includePaths and in case of presence of edited files
 * requires version in `package.json` to be updated.
 * Parameter @restrictToBranches defines branches to run the check for.
 * Parameter @excludePaths defines patterns to exclude from checking.
 */
export const bumpPackageVersion = async (params: {
  danger: DangerDSLType
  excludePaths?: Array<string>
  fail: (message: string) => void
  includePaths: Array<string>
  restrictToBranches: Array<string>
}) => {
  if (!R.includes(params.danger.github.pr.base.ref, params.restrictToBranches)) {
    return
  }

  const files = params.danger.git.fileMatch(`**/*`)

  if (!files.edited) {
    return
  }

  await Promise.all(
    R.forEach(async (includePath) => {
      const includedFiles = params.danger.git.fileMatch(`${includePath}/**/*`)

      // If there are no edits in the includePath the version should not be bumped
      if (!includedFiles.edited) {
        return
      }

      // Exclude paths containing any of the `excludePaths`.
      const editedFiles = R.reject(R.includes(R.__, params.excludePaths || []), includedFiles.getKeyedPaths().edited)

      if (!editedFiles.length) {
        return
      }

      const packageJson = await params.danger.git.JSONDiffForFile(`${includePath}/package.json`)

      if (!packageJson || !packageJson.version || packageJson.version.after === packageJson.version.before) {
        params.fail(`The version in package.json must be updated in ${includePath}`)
      }
    }, params.includePaths),
  )
}
