import * as R from 'ramda'
import type {RuleParamsBase} from 'utils'
import {filterPaths, getUniquePaths} from 'utils'
import {isReactComponentFolder} from './utils'

type RuleParamsDirNameRestrictions = RuleParamsBase & {
  /**
   * Components to exclude (a component is a folder with an "index.tsx" file, therefore only the folder path is required).
   */
  excludeComponents?: Array<string>
}

/**
 * For all created/modified files traverses up through all containing folders
 * and requires the following rules to apply:
 * - a React Component dir name must have first letter capitalized;
 * - a React Component dir name must be in camel case;
 * - Non-component and Next.js route dir names should not be in camel case,
 * but instead should be in dash case;
 * - Non-component dir name must have first letter in lower case;
 * - Use "-" (not "_") in non-component dir names.
 * @param danger Danger instance
 * @param fail Danger fail function
 * @param excludeComponents components to exclude
 * (a component is a folder with an "index.tsx" file, therefore only the folder path is required)
 * @param excludePaths paths to exclude
 * @param includePaths paths to include
 */
export const dirNameRestrictions = (params: RuleParamsDirNameRestrictions): void => {
  R.compose(
    R.forEach((path: string) => {
      const {fail} = params
      const isReactComponent = isReactComponentFolder(path)
      const dirName = R.compose<[str: string], Array<string>, string>(R.last, R.split('/'))(path)
      const isDirNameFirstLetterCapitalized = dirName.match(/^[A-Z]/)
      const isDirNameCamelCased = dirName.match(/[a-z][A-Z]/g)
      const isDirNameSnakeCased = dirName.match(/[_]+/g)
      const isDirNameDashCased = dirName.match(/[\-_]+/g)
      const isNextjsRouteParameterDir = dirName.match(/^\[.*\]$/g)

      if (isReactComponent && !isDirNameFirstLetterCapitalized) {
        fail(`Component's dir name must have first letter capitalized: ${path}`)
      }

      if (isReactComponent && (isDirNameDashCased || isDirNameSnakeCased)) {
        fail(`Component's dir name must be in camel case: ${path}`)
      }

      if (!isReactComponent && isDirNameCamelCased && !isNextjsRouteParameterDir) {
        fail(
          `Non-component's and Next.js route dir names should not be in camel case, but instead should be in dash case: ${path}`,
        )
      }

      if (!isReactComponent && isDirNameFirstLetterCapitalized) {
        fail(`Non-component's dir name must have first letter in lower case: ${path}`)
      }

      if (!isReactComponent && isDirNameSnakeCased) {
        fail(`Use "-" instead of "_" in non-component dir names: ${path}`)
      }
    }),

    R.filter(R.compose(R.not, R.includes(R.__, params.excludeComponents || []))),
    getUniquePaths,
    filterPaths,
  )(params)
}
