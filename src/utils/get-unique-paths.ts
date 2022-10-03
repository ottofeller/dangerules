import * as R from 'ramda'

/**
 * Returns a set of unique paths which are parents to all the paths from `paths` input param.
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
