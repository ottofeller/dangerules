import {readFileSync} from 'fs'
import * as R from 'ramda'
import type {RuleParamsBase} from 'utils'
import {filterPaths, getUniquePaths} from 'utils'

/**
 * For all created/modified files traverses up through all containing folders
 * and requires the name of the exported component constant to match the name of the function in the memo.
 *
 * @param danger Danger instance
 * @param fail Danger fail function
 * @param excludePaths paths to exclude
 * @param includePaths paths to include
 */
export const componentName = (params: RuleParamsBase): void => {
  R.compose(
    R.forEach((path: string) => {
      const {fail} = params

      let matches: RegExpMatchArray | null | undefined
      try {
        matches = readFileSync(`${path}/index.tsx`, {encoding: 'utf8', flag: 'r'}).match(
          /(\w+) = memo\(function (\w+)\(/i,
        )
      } catch (error: any) {
        // Any component's dir must have index.tsx within it. If index.tsx file was not found then it is not a component's dir
        return
      }

      if (!matches) {
        return
      }

      const [, _componentName, functionName] = matches

      if (_componentName !== functionName) {
        fail(`The name of the exported component constant must match the name of the function in the memo: ${path}`)
      }
    }),

    getUniquePaths,
    filterPaths,
  )(params)
}
