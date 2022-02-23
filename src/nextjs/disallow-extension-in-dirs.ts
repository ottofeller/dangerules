import * as R from 'ramda'
import {DangerDSLType} from 'danger'

/**
 * Disallow a file extension in the selected dirs
 * and provides a required extension for the files.
 *
 * @param danger Danger instance
 * @param fail Danger fail function
 * @param excludePaths paths to exclude
 * @param includePaths paths to include
 * @param extension not allowed extension
 * @param requireExtension required extension
 */
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
