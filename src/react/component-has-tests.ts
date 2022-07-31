import {readFileSync} from 'fs'
import * as R from 'ramda'
import {RuleParamsBase} from './types'
import {filterPaths} from './utils'

type ComponentHasTestRuleParams = RuleParamsBase & {testFile?: string}

/**
 * Finds React components within a project and checks them form test coverage.
 * A component shall have `__tests__` folder with `index.tsx` (or other if input) file.
 * The test file is searched for the following statements:
 * - component import in form `import {ComponentName} from '../index'`
 * - `describe('...` block
 * 
 * @param danger Danger instance
 * @param fail Danger fail function
 * @param excludePaths paths to exclude
 * @param includePaths paths to include
 * @param testFile name of file to search for within `__tests__` folder (`index.tsx` if not input)
 */
export const componentHasTests = (params: ComponentHasTestRuleParams) => {
  R.compose(
    R.forEach<string>((path) => {
      const dirName = R.compose<Array<string>, Array<string>, string>(R.last, R.split('/'))(path)

      let isReactComponent

      if (dirName === '__tests__') {
        return
      }

      try {
        isReactComponent = readFileSync(`${path}/index.tsx`, {encoding: 'utf8', flag: 'r'}).match(/\= memo\(/gi)
      } catch (error: any) {
        // Any component's dir must have index.tsx within it. If index.tsx file was not found then it is not a component's dir
        // eslint-disable-next-line max-depth -- need to keep the condition within a try-catch block
        if (error?.code === 'ENOENT') {
          isReactComponent = false
        }
      }

      if (!isReactComponent) {
        return false
      }

      const testFile = params.testFile || 'index.tsx'
      let testFileContent

      try {
        testFileContent = readFileSync(`${path}/__tests__/${testFile}`, {encoding: 'utf8', flag: 'r'})
      } catch (error: any) {
        // Any component's dir must have index.tsx within it. If index.tsx file was not found then it is not a component's dir
        // eslint-disable-next-line max-depth -- need to keep the condition within a try-catch block
        if (error?.code === 'ENOENT') {
          params.fail(`No test file found for component ${path}`)
        }

        return
      }

      if (!testFileContent.includes(`import {${dirName}} from '../index'`)) {
        params.fail(`The test file for component ${path} does not contain the component import`)
      }

      if (!testFileContent.includes('describe(')) {
        params.fail(`The test file for component ${path} does not contain a "describe" block with the component name`)
      }
    }),

    R.uniq,

    // Strip the file from a path /some/path/somefile.tsx > /some/path
    R.map(
      R.compose<[x: string], Array<string>, Array<string>, string>(
        R.join('/'),
        R.init,
        R.split('/'),
      ),
    ),

    filterPaths,
  )(params)
}
