import {DangerDSLType} from 'danger'
import {disallowExtensionInDirs} from '../index'

describe('Next.js rules', () => {
  describe('Disallow file extension in dirs', () => {
    it('throws a failure if files with disallowed  extension were created in dirs', () => {
      const failMock = jest.fn()

      disallowExtensionInDirs({
        danger: {
          git: {
            fileMatch: () => ({
              edited: true,
              getKeyedPaths: () => ({edited: ['src/index.ts', 'src/pages/index.ts']}),
            }),
          },
        } as DangerDSLType,

        extension: 'ts',
        fail: failMock,
        includePaths: ['src/'],
        requireExtension: 'tsx',
      })

      expect(failMock).toHaveBeenCalled()

      disallowExtensionInDirs({
        danger: {
          git: {
            fileMatch: () => ({
              edited: true,
              getKeyedPaths: () => ({edited: ['src/index.tsx', 'src/api/file.tsx']}),
            }),
          },
        } as DangerDSLType,

        extension: 'tsx',
        fail: failMock,
        includePaths: ['api/'],
        requireExtension: 'ts',
      })

      expect(failMock).toHaveBeenCalled()
    })

    it("doesn't throw a failure in case a file was found in a dir that is specified in the excludePaths", () => {
      const failMock = jest.fn()

      disallowExtensionInDirs({
        danger: {
          git: {
            fileMatch: () => ({
              edited: true,
              getKeyedPaths: () => ({edited: ['src/api/index.ts', 'src/types/index.ts']}),
            }),
          },
        } as DangerDSLType,

        excludePaths: ['api/', 'types/'],
        extension: 'ts',
        fail: failMock,
        includePaths: ['src/'],
        requireExtension: 'tsx',
      })

      expect(failMock).not.toHaveBeenCalled()
    })
  })
})
