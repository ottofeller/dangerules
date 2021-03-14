import * as R from 'ramda'
import {DangerDSLType} from 'danger'

// Disallow a file extenstion in the selected dirs
export const disallowExtensionInDirs = (params: {
  danger: DangerDSLType
  extension: string
  fail: (message: string) => void
  excludePaths?: Array<string>
  includePaths: Array<string>
  requireExtension: string
}) => {
  const filesWithExtension = params.danger.git.fileMatch(`**/*.${params.extension}`)

  if(!filesWithExtension.edited) {
    return
  }

  const filesInWrongDirs = R.reject(
    R.anyPass([
      ...R.map(includePath => R.compose(R.not, R.includes(includePath)), params.includePaths),
      ...R.map(excludePath => R.includes(excludePath), params.excludePaths || []),
    ]),

    filesWithExtension.getKeyedPaths().edited,
  )

  if(!R.isEmpty(filesInWrongDirs)) {
    params.fail(`These files should have \`.${params.requireExtension}\` extension: ${
      R.map(file => `\`${file}\` `, filesInWrongDirs)
    }`)
  }
}
