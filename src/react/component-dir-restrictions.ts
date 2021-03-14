import * as R from 'ramda'
import {DangerDSLType} from 'danger'
import {readFileSync} from 'fs'

export const componentDirRestrictions = (params: {
  danger: DangerDSLType
  fail: (message: string) => void
}) => {
  let checkedPaths: Array<string> = []

  R.forEach((file: string) => {
    const dirs = R.compose<string, Array<string>, Array<string>>(R.init, R.split('/'))(
      params.danger.git.fileMatch(file).getKeyedPaths().created[0] ||
        params.danger.git.fileMatch(file).getKeyedPaths().edited[0],
    )

    R.forEach(index => {
      const path = R.compose(R.join('/'), R.slice(0, index))(dirs)
      const dirName = dirs[index - 1]
      const isDirNameFirstLetterCapitalized = dirName.match(/^[A-Z]/)
      const isDirNameCamelCased = !dirName.match(/[\-_]+/g)
      let isReactComponent

      // Don't check the same hierarchy of paths twice
      if(R.any(R.includes(path), checkedPaths)) {
        return
      }

      
      if(dirName === '__tests__') {
        return
      }

      try {
        isReactComponent = readFileSync(`${path}/index.tsx`, {encoding: 'utf8', flag: 'r'}).match(/\= memo\(/gi)
      } catch(error) {
        // Any component's dir must have index.tsx within it. If index.tsx file was not found then it is not a component's dir
        if(error.code === 'ENOENT') {
          isReactComponent = false
        }
      }

      if(isReactComponent && !isDirNameFirstLetterCapitalized) {
        params.fail(`Component's dir name must have first letter capitalized: ${path}`)
      }

      if(isReactComponent && !isDirNameCamelCased) {
        params.fail(`Component's dir name must be in camel case: ${path}`)
      }

      checkedPaths = R.concat(checkedPaths, [path])
    }, R.range(1, dirs.length + 1))
  }, R.concat(params.danger.git.modified_files, params.danger.git.created_files))
}
