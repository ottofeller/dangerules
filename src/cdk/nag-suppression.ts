import type {AddChange, Change, Chunk} from 'parse-diff'
import * as R from 'ramda'
import type {FilterParams, RuleParamsBase} from 'utils'
import {filterPaths} from 'utils'

type RuleParamsNagSuppression = RuleParamsBase<'warn'> & {
  /**
   * Files to exclude.
   */
  excludeFiles?: Array<string>

  /**
   * A list of file extensions to check.
   */
  includeFileExtensions?: Array<string>
}

/**
 * Searches for addResourceSuppressions method calls on NagSuppressions class from cdk-nag package.
 * Warns if invocations are found in new/edited files.
 *
 * @param danger Danger instance
 * @param warn Danger warn/fail function
 * @param includePaths search paths (all subfolders are included)
 * @param includeFileExtensions a list of file extensions to check
 * @param excludePaths paths to exclude from search (all subfolders are excluded)
 * @param excludeFiles path to particular files to exclude (used primarily to exclude files deeps inside searched folders)
 */
export const nagSuppression = async (params: RuleParamsNagSuppression) => {
  const {danger, excludeFiles = [], warn, includeFileExtensions = ['ts', 'js']} = params

  await R.compose<[params: FilterParams], Array<string>, Array<string>, Array<string>, Array<string>, Promise<void[]>>(
    Promise.all.bind(Promise),

    R.forEach(async (path: string) => {
      const diff = await danger.git.structuredDiffForFile(path)

      if (!diff) {
        return
      }

      const resourceSuppressionsRegex = /\.addResourceSuppressions\(/

      R.compose<
        [chunks: Chunk[]],
        Array<Array<Change>>,
        Array<Change>,
        Array<AddChange>,
        Array<AddChange>,
        Array<AddChange>
      >(
        R.forEach(({ln}) => warn(`Found new NAG suppression call in file "${path}" at line ${ln}`, path, ln)),
        R.filter<AddChange>(({content}) => resourceSuppressionsRegex.test(content)),
        R.filter<Change, AddChange>((change): change is AddChange => change.type === 'add'),
        R.flatten,
        R.map((chunk) => chunk.changes),
      )(diff.chunks)
    }),

    R.reject(R.includes(R.__, excludeFiles)),
    R.filter(R.anyPass(R.map((fileExtension) => R.endsWith(`.${fileExtension}`), includeFileExtensions))),
    filterPaths,
  )(params)
}
