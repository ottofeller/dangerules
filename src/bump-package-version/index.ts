import {DangerDSLType} from 'danger'
import * as R from 'ramda'

/**
 * Checks all @includePaths and in case of presence of edited files
 * requires version in `package.json` to be updated.
 * Parameter @restrictToBranches defines branches to run the check for.
 */
export const bumpPackageVersion = async (params: {
  danger: DangerDSLType
  excludePaths?: Array<string>
  fail: (message: string) => void
  includePaths: Array<string>
  restrictToBranches: Array<string>
}) => {
  if (!params.restrictToBranches.includes(params.danger.github.pr.base.ref)) {
    return
  }

  const files = params.danger.git.fileMatch(`**/*`)

  if (!files.edited) {
    return
  }

  const paths = R.compose(
    R.reject(
      R.anyPass(R.map<string, (list: string | readonly string[]) => boolean>(R.includes, params.excludePaths || [])),
    ),
    R.filter(R.anyPass(R.map(R.includes, params.includePaths))),
  )(files.getKeyedPaths().edited) as string[]

  await Promise.all(
    R.forEach(async (path) => {
      // If there are no edits in the includePath the version should not be bumped
      if (!params.danger.git.fileMatch(`${path}/**/*`).edited) {
        return
      }

      const packageJson = await params.danger.git.JSONDiffForFile(`${path}/package.json`)

      if (!packageJson || !packageJson.version || packageJson.version.after === packageJson.version.before) {
        params.fail(`The version in package.json must be updated in ${path}`)
      }
    }, paths),
  )
}
