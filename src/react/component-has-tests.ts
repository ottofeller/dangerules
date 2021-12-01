import * as R from 'ramda'
import {DangerDSLType} from 'danger'
import {readFileSync} from 'fs'

/**
 * Finds React components within a project and checks them form test coverage.
 * A component shall have `__tests__` folder with `index.tsx` file.
 * The test file is searched for the following statements:
 * - component import in form `import {ComponentName} from '../index'`
 * - `describe('ComponentName', () => {`
 * - `it('renders properly', () => {`
 */
export const componentHasTests = (params: {
  danger: DangerDSLType
  excludePaths?: Array<string>
  fail: (message: string) => void
  includePaths: Array<string>
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
        let testFile

        try {
          testFile = readFileSync(
            `${path}/__tests__/index.tsx`,
            {encoding: 'utf8', flag: 'r'},
          )
        } catch(error: any) {
          // Any component's dir must have index.tsx within it. If index.tsx file was not found then it is not a component's dir
          if(error?.code === 'ENOENT') {
            params.fail(`No test file found for component ${path}`)
          }

          return
        }

        if(!testFile.includes(`import {${dirName}} from '../index'`)) {
          params.fail(`The test file for component ${path} does not contain the component import`)
        }

        if(!testFile.includes(`describe('${dirName}', () => {`)) {
          params.fail(`The test file for component ${path} does not contain a "describe" block with the component name`)
        }

        if(!testFile.includes('it(\'renders properly\', () => {')) {
          params.fail(`The test file for component ${path} does not contain a check for proper render`)
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
