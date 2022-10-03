import * as R from 'ramda'
import type {RuleParamsBase} from 'utils'
import {filterPaths} from 'utils'

type RuleParamsNagSuppression = RuleParamsBase & {
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
 * @param fail Danger warn/fail function
 * @param includePaths search paths (all subfolders are included)
 * @param includeFileExtensions a list of file extensions to check
 * @param excludePaths paths to exclude from search (all subfolders are excluded)
 * @param excludeFiles path to particular files to exclude (used primarily to exclude files deeps inside searched folders)
 */
export const nagSuppression = async (params: RuleParamsNagSuppression) => {
  const {danger, excludeFiles = [], fail, includeFileExtensions = ['ts', 'js']} = params

  await R.compose<
    [params: Omit<RuleParamsBase, 'fail'>],
    Array<string>,
    Array<string>,
    Array<string>,
    Array<string>,
    Promise<void[]>
  >(
    Promise.all.bind(Promise),

    R.forEach(async (path: string) => {
      const diff = await danger.git.diffForFile(path)

      if (!diff) {
        return
      }

      const matches = diff.added.match(/\.addResourceSuppressions\(/g)

      if (matches) {
        fail(`Found ${matches.length} new NAG suppression calls`, path)
      }
    }),

    R.reject(R.includes(R.__, excludeFiles)),
    R.filter(R.anyPass(R.map((fileExtension) => R.endsWith(`.${fileExtension}`), includeFileExtensions))),
    filterPaths,
  )(params)
}
