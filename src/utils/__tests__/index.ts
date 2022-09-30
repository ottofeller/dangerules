import type {DangerDSLType} from 'danger'
import * as R from 'ramda'
import {filterPaths, getUniquePaths} from '..'

describe('Utils', () => {
  describe('filePaths', () => {
    it('takes "created_files" and "modified_files" from git info on the Danger DSL instance and filters off files outside "includePaths" and within "excludePaths"', () => {
      const includePath = 'src'
      const modifiedAndIncludedFile = `${includePath}/modified/index.ts`
      const createdAndIncludedFile = `${includePath}/created/index.ts`

      const excludePath = `${includePath}/excluded`
      const modifiedAndExcludedFile = `${excludePath}/modified/index.ts`
      const createdAndExcludedFile = `${excludePath}/created/index.ts`

      const notIncludedPath = 'scripts'
      const modifiedAndNotIncludedFile = `${notIncludedPath}/modified/index.ts`
      const createdAndNotIncludedFile = `${notIncludedPath}/created/index.ts`

      const includePaths = [includePath]
      const excludePaths = [excludePath]
      const createdFiles = [createdAndIncludedFile, createdAndExcludedFile, createdAndNotIncludedFile]
      const modifiedFiles = [modifiedAndIncludedFile, modifiedAndExcludedFile, modifiedAndNotIncludedFile]

      const result = filterPaths({
        danger: {
          git: {
            created_files: createdFiles,

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({
                created: R.includes(file, createdFiles) ? [file] : [],
                edited: R.includes(file, modifiedFiles) ? [file] : [],
              }),
            }),

            modified_files: modifiedFiles,
          },
        } as DangerDSLType,

        includePaths,
        excludePaths,
      })

      expect(result).toContain(modifiedAndIncludedFile)
      expect(result).toContain(createdAndIncludedFile)
      expect(result).not.toContain(modifiedAndExcludedFile)
      expect(result).not.toContain(createdAndExcludedFile)
      expect(result).not.toContain(modifiedAndNotIncludedFile)
      expect(result).not.toContain(createdAndNotIncludedFile)
    })
  })

  describe('getUniquePaths', () => {
    it('for the provided file paths traverses up through all containing folders and returns unique folder paths', () => {
      const result = getUniquePaths(['path/to/a/file.ts', 'path/to/another/file.ts'])
      expect(result).toEqual(['path', 'path/to', 'path/to/a', 'path/to/another'])
    })

    it('excludes "__tests__" and "__mocks__" folders by default', () => {
      const result = getUniquePaths([
        'path/to/a/file.ts',
        'path/to/a/__mocks__/file.ts',
        'path/to/another/file.ts',
        'path/to/another/__tests__/file.ts',
      ])

      expect(result).toEqual(['path', 'path/to', 'path/to/a', 'path/to/another'])
    })

    it('excludes only provided "excludeFolders" with the second parameter', () => {
      const result = getUniquePaths(
        [
          'path/to/a/file.ts',
          'path/to/a/__mocks__/file.ts',
          'path/to/a/exclude/file.ts',
          'path/to/another/file.ts',
          'path/to/another/__tests__/file.ts',
          'path/to/another/exclude/file.ts',
        ],

        ['exclude'],
      )

      expect(result).toEqual([
        'path',
        'path/to',
        'path/to/a',
        'path/to/a/__mocks__',
        'path/to/another',
        'path/to/another/__tests__',
      ])
    })
  })
})
