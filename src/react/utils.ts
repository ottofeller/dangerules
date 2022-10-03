import {readFileSync} from 'fs'

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
