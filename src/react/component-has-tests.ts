import * as R from 'ramda'
import {DangerDSLType} from 'danger'
import {readFileSync} from 'fs'

/**
 * Finds React components within a project and checks them form test coverage.
 * A component shall have `__tests__` folder with `index.tsx` (or other if input) file.
 * The test file is searched for the following statements:
 * - component import in form `import {ComponentName} from '../index'`
 * - `describe('...` block
 * @param danger Dnager instance
 * @param fail Danger fail function
 * @param excludePaths paths to exclude
 * @param includePaths paths to include
 * @param testFile name of file to search for within `__tests__` folder (`index.tsx` if not input)
 */
export const componentHasTests = (params: {
  danger: DangerDSLType
  excludePaths?: Array<string>
  fail: (message: string) => void
  includePaths: Array<string>
  testFile?: string
}) => {
  R.compose<
    Array<string>,
    Array<string>,
    Array<string>,
    Array<string>,
    Array<string>
  >(
    R.forEach<string>(path => {
      const dirName = R.compose<string, Array<string>, string>(
        R.last,
        R.split('/'),
      )(path)

      let isReactComponent

      if(dirName === '__tests__') {
        return
      }

      try {
        isReactComponent = readFileSync(
          `${path}/index.tsx`,
          {encoding: 'utf8', flag: 'r'},
        ).match(/\= memo\(/gi)
      } catch(error: any) {
        // Any component's dir must have index.tsx within it. If index.tsx file was not found then it is not a component's dir
        if(error?.code === 'ENOENT') {
          isReactComponent = false
        }
      }

      if(isReactComponent) {
        const testFile = params.testFile || 'index.tsx'
        let testFileContent

        try {
          testFileContent = readFileSync(
            `${path}/__tests__/${testFile}`,
            {encoding: 'utf8', flag: 'r'},
          )
        } catch(error: any) {
          // Any component's dir must have index.tsx within it. If index.tsx file was not found then it is not a component's dir
          if(error?.code === 'ENOENT') {
            params.fail(`No test file found for component ${path}`)
          }

          return
        }

        if(!testFileContent.includes(`import {${dirName}} from '../index'`)) {
          params.fail(`The test file for component ${path} does not contain the component import`)
        }

        if(!testFileContent.includes('describe(')) {
          params.fail(`The test file for component ${path} does not contain a "describe" block with the component name`)
        }
      }
    }),

    R.uniq,

    R.map(
      R.compose(
        R.join('/'),
        R.slice(0, -1),
        R.split('/'),

        (file: string) => params.danger.git.fileMatch(file).getKeyedPaths().created[0] ||
          params.danger.git.fileMatch(file).getKeyedPaths().edited[0],
      ),
    ),

    R.reject(
      R.anyPass([
        ...R.map(includePath => R.compose(R.not, R.startsWith(includePath)), params.includePaths),
        ...R.map(excludePath => R.startsWith(excludePath), params.excludePaths || []),
      ]),
    ),
  )(R.concat(params.danger.git.modified_files, params.danger.git.created_files))
}
