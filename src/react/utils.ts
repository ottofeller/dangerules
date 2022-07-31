import {readFileSync} from 'fs'
import * as R from 'ramda'
import type {RuleParamsBase} from './types'

/**
 * For all created/modified files finds those staring with includePaths (excluding those starting with excludePaths).
 * 
 * @param danger Danger instance
 * @param excludePaths paths to exclude
 * @param includePaths paths to include
 */
 export const filterPaths = (params: Omit<RuleParamsBase, 'fail'>): Array<string> => {
  const {danger, includePaths} = params
  const excludePaths = params.excludePaths || []

  return R.compose(
    R.map(
      (file: string) =>
        danger.git.fileMatch(file).getKeyedPaths().created[0] || danger.git.fileMatch(file).getKeyedPaths().edited[0],
    ),
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
export const getUniquePaths = (
  paths: Array<string>,
  excludeFolders = ['__tests__', '__mocks__'],
): Array<string> =>
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
          R.compose<Array<Array<string>>, Array<string>, string>(
            R.join('/'),
            R.slice(0, i + 1)
          )(list!),
        ),
        R.init,
        R.split('/'),
      ),
    ),
  )(paths)

/**
 * Check a folder path for containing a React component.
 * 
 * @param path search path
 */
 export const isReactComponentFolder = (path: string): boolean => {
  let isReactComponent = false

  try {
    isReactComponent = /\= memo\(/gi.test(readFileSync(`${path}/index.tsx`, {encoding: 'utf8', flag: 'r'}))
  } catch (error: any) {
    // Any component's dir must have index.tsx within it. If index.tsx file was not found then it is not a component's dir
    // eslint-disable-next-line max-depth -- need to keep the condition within a try-catch block
    if (error?.code === 'ENOENT') {
      isReactComponent = false
    }
  }

  return isReactComponent
}
