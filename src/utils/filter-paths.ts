import * as R from 'ramda'
import type {FilterParams} from './types'

/**
 * For all created/modified files finds those starting with includePaths (excluding those starting with excludePaths).
 *
 * @param danger Danger instance
 * @param excludePaths paths to exclude
 * @param includePaths paths to include
 */
export const filterPaths = (params: FilterParams): Array<string> => {
  const {danger, excludePaths = [], includePaths} = params

  return R.compose(
    R.map((file: string) => {
      const {created, edited} = danger.git.fileMatch(file).getKeyedPaths()
      return created[0] || edited[0]
    }),
    R.reject(
      R.anyPass([
        ...R.map((includePath) => R.compose(R.not, R.startsWith(includePath)), includePaths),
        ...R.map<string, (str: string) => boolean>(R.startsWith, excludePaths),
      ]),
    ),
  )(R.concat(danger.git.modified_files, danger.git.created_files))
}
