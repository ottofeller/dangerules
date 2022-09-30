import * as R from 'ramda'
import type {RuleParamsBase} from './types'

/**
 * For all created/modified files finds those starting with includePaths (excluding those starting with excludePaths).
 *
 * @param danger Danger instance
 * @param excludePaths paths to exclude
 * @param includePaths paths to include
 */
export const filterPaths = (params: Omit<RuleParamsBase, 'fail'>): Array<string> => {
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

/**
 * For the provided file paths traverses up through all containing folders
 * and returns unique folder paths.
 *
 * @param paths search paths
 * @param excludeFolders folder names to exclude from the result
 */
export const getUniquePaths = (paths: Array<string>, excludeFolders = ['__tests__', '__mocks__']): Array<string> =>
  R.compose<[paths: Array<string>], Array<string>, Array<string>>(
    R.uniq,
    R.chain(
      R.compose<[file: string], Array<string>, Array<string>, Array<string>, Array<string>, Array<string>>(
        R.filter(Boolean),
        R.filter(
          R.compose<[str: string], Array<string>, string, boolean, boolean>(
            R.not,
            R.includes(R.__, excludeFolders),
            R.last,
            R.split('/'),
          ),
        ),
        R.addIndex<string, string>(R.map)((_dir, i, list) =>
          R.compose<Array<Array<string>>, Array<string>, string>(R.join('/'), R.slice(0, i + 1))(list!),
        ),
        R.init,
        R.split('/'),
      ),
    ),
  )(paths)
