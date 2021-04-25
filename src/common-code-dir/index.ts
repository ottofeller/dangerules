import * as babelParse from '@babel/parser'
import * as babelTypes from '@babel/types'
import * as fs from 'fs'
import * as path from 'path'
import * as R from 'ramda'
import {DangerDSLType} from 'danger'

const readdirNested = (params: {allFoundFiles: Array<string>, path: string}): Array<string> => {
  const files = fs.readdirSync(params.path)
  let newAllFoundFiles: Array<string> = params.allFoundFiles

  R.forEach(file => {
    if(fs.statSync(`${params.path.replace(/\/$/, '')}/${file}`).isDirectory()) {
      newAllFoundFiles = readdirNested({
        allFoundFiles: params.allFoundFiles,
        path         : `${params.path.replace(/\/$/, '')}/${file}`,
      })
    }else{
      newAllFoundFiles.push(`${params.path.replace(/\/$/, '')}/${file}`)
    }
  }, files)

  return newAllFoundFiles
}

/*
  Require a common code to be located in the common/ dir:
  * Collect all imports from all files
  * Resolve them to absolute paths
  * Construct plain array of all imports
  * If an import paths counts more than once and has no "/common/" string inluded, throw a fail().
*/
export const commonCodeDir = (params: {
  baseImportPath?: string
  danger: DangerDSLType
  fail: (message: string) => void
  excludePaths?: Array<string>
  includePaths: Array<string>
}) => {
  R.forEach(
    innerParams => {
      if(innerParams[1] > 1) {
        params.fail(`"${innerParams[0]}" should be moved to common/ dir`)
      }
    },
    
    R.toPairs(R.compose<
      Array<string>,
      Array<Array<string>>,
      Array<string>,
      Array<Array<string>>,
      Array<string>,
      Array<string>,
      Record<string, number>
    >(
      R.countBy(R.identity),

      // TODO Check for existence of file (to exclude imports from node_modules)
      // Only count import paths without "/common/"
      R.filter<string>((innerPath: string) => fs.existsSync(innerPath) && !R.includes('/common/', innerPath)),

      R.flatten,

      R.map(innerPath => R.compose<
        Array<babelTypes.Statement>,
        Array<babelTypes.Statement>,
        Array<string | undefined>,
        Array<string>
      >(

        // Resolve import path to absolute path
        R.map(importPath => path.resolve(
          (importPath || '').match(/^[a-z]/i) ? params.baseImportPath || '' : innerPath.replace(/\/index\.tsx/, ''),
          importPath || '/',
        )),

        // Get the import path string from babel statement
        R.map(R.path(['source', 'value'])),

        // Get all babel statements of imports from AST
        R.filter((statement: babelTypes.Statement) => statement.type === 'ImportDeclaration'),
      )(
        babelParse.parse(
          (fs.readFileSync(path.resolve(params.baseImportPath || '', innerPath)) || '').toString(),
          {errorRecovery: true, plugins: ['jsx', 'typescript'], sourceType: 'module'},
        ).program.body),
      ),

      R.flatten,

      // Find all js/jsx/ts/tsx files (including nested ones) in a dir
      // Exclude unit tests, their imports should not be considered as common
      R.map(includePath => R.filter(
        innerPath => !R.isEmpty(R.match(/(js|jsx|ts|tsx)$/i, innerPath)) &&
          R.isEmpty(R.match(/__tests__/i, innerPath)),

        readdirNested({allFoundFiles: [], path: includePath}),
      )),
    )(params.includePaths)),
  )
}
