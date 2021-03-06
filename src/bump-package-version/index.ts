import {DangerDSLType} from 'danger'

export const bumpPackageVersion = async (params: {
  danger: DangerDSLType
  fail: (message: string) => void
  includePaths: Array<string>
}) => {
  // eslint-disable-next-line fp/no-loops
  for(const includePath of params.includePaths) {
    // If there are no edits in the includePath the version should not be bumped
    if(!params.danger.git.fileMatch(`${includePath}/**/*`).edited) {
      continue
    }

    const packageJsonVersionChange = (await params.danger.git.JSONDiffForFile(`${includePath}/package.json`))?.version

    if(!packageJsonVersionChange || packageJsonVersionChange.after === packageJsonVersionChange.before) {
      params.fail(`The version in package.json must be updated in ${includePath}`)
    }
  }
}
