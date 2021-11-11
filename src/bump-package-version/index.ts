import {DangerDSLType} from 'danger'

export const bumpPackageVersion = async (params: {
  danger: DangerDSLType
  fail: (message: string) => void
  includePaths: Array<string>
}) => {
  if(!/^(master|main)$/.test(params.danger.github.pr.base.ref)) {
    return
  }
  
  // eslint-disable-next-line fp/no-loops
  for(const includePath of params.includePaths) {
    // If there are no edits in the includePath the version should not be bumped
    if(!params.danger.git.fileMatch(`${includePath}/**/*`).edited) {
      continue
    }

    const packageJson = await params.danger.git.JSONDiffForFile(`${includePath}/package.json`)

    if(!packageJson || !packageJson.version || packageJson.version.after === packageJson.version.before) {
      params.fail(`The version in package.json must be updated in ${includePath}`)
    }
  }
}
