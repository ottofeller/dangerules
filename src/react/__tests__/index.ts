import {DangerDSLType} from 'danger'
import * as fs from 'fs'
import {componentHasTests, dirNameRestrictions} from '../index'
jest.mock('fs')

describe('React rules', () => {
  const validReactComponent = 'const SomeComponent = memo(function NewComponent() { return null })'

  const failMock = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('Restrictions on the dir name', () => {
    ;['__tests__', '__mocks__'].forEach((dirName) => {
      it(`does not check "${dirName}" folders`, () => {
        const componentFilePath = 'src/another/Component/index.tsx'
        const testFilePath = `src/another/Component/${dirName}/index.tsx`

        // @ts-ignore
        fs.readFileSync.mockImplementation((path: string) => {
          if (path === testFilePath || path === componentFilePath) {
            return validReactComponent
          }
        })

        dirNameRestrictions({
          danger: {
            git: {
              created_files: [] as Array<string>,

              fileMatch: (file: string) => ({
                getKeyedPaths: () => ({created: [''], edited: [file]}),
              }),

              modified_files: [testFilePath],
            },
          } as DangerDSLType,

          fail: failMock,
          includePaths: ['src'],
        })

        expect(failMock).not.toHaveBeenCalled()

        // Once per each path component, but not for "dirName"
        expect(fs.readFileSync).toHaveBeenCalledTimes(3)
      })
    })

    it(`does not check a file twice`, () => {
      const componentFilePaths = [
        'src/Component/index.tsx',
        'src/Component/Icon/index.tsx',
        'src/Component/Button/index.tsx',
      ]

      // @ts-ignore
      fs.readFileSync.mockImplementation((path: string) => {
        if (componentFilePaths.includes(path)) {
          return validReactComponent
        }
      })

      dirNameRestrictions({
        danger: {
          git: {
            created_files: [] as Array<string>,

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: componentFilePaths,
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['src'],
      })

      expect(failMock).not.toHaveBeenCalled()

      // Once per each folder (src, Component, Icon, Button)
      expect(fs.readFileSync).toHaveBeenCalledTimes(4)
    })

    it("requires component's dir name to have first letter capitalized", () => {
      const invalidPathToReactComponent = 'src/component/index.tsx'
      const validPathToReactComponent = 'src/another/Component/index.tsx'

      // @ts-ignore
      fs.readFileSync.mockImplementation((path: string) => {
        if (path === invalidPathToReactComponent || path === validPathToReactComponent) {
          return validReactComponent
        }
      })

      dirNameRestrictions({
        danger: {
          git: {
            created_files: [invalidPathToReactComponent],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: [validPathToReactComponent],
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['src'],
      })

      expect(failMock).toHaveBeenCalled()
      failMock.mockReset()

      dirNameRestrictions({
        danger: {
          git: {
            created_files: [''],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: [validPathToReactComponent],
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['src'],
      })

      expect(failMock).not.toHaveBeenCalled()
      failMock.mockReset()

      // @ts-ignore
      fs.readFileSync.mockImplementation(() => 'const someExport = 1')

      dirNameRestrictions({
        danger: {
          git: {
            created_files: [''],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: ['src/some-non-component/index.tsx'],
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['src'],
      })

      expect(failMock).not.toHaveBeenCalled()
    })

    it("requires component's dir name to be in camel case", () => {
      const invalidPathToReactComponent = 'src/someComponent/index.tsx'
      const validPathToReactComponent = 'src/another/SomeComponent/index.tsx'

      // @ts-ignore
      fs.readFileSync.mockImplementation((path: string) => {
        if (path === invalidPathToReactComponent || path === validPathToReactComponent) {
          return validReactComponent
        }
      })

      dirNameRestrictions({
        danger: {
          git: {
            created_files: [invalidPathToReactComponent],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: [validPathToReactComponent],
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['src'],
      })

      expect(failMock).toHaveBeenCalled()
      failMock.mockReset()

      dirNameRestrictions({
        danger: {
          git: {
            created_files: [''],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: [validPathToReactComponent],
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['src'],
      })

      expect(failMock).not.toHaveBeenCalled()
    })

    it("requires non-component's dir name to be in dash case", () => {
      // @ts-ignore
      fs.readFileSync.mockImplementation(() => '')

      dirNameRestrictions({
        danger: {
          git: {
            created_files: ['src/someComponent/index.ts'],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: ['src/another/SomeComponent/index.ts'],
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['src'],
      })

      expect(failMock).toHaveBeenCalled()
      failMock.mockReset()

      dirNameRestrictions({
        danger: {
          git: {
            created_files: [''],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: ['src/another/some_component/index.ts'],
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['src'],
      })

      expect(failMock).toHaveBeenCalled()
      failMock.mockReset()

      dirNameRestrictions({
        danger: {
          git: {
            created_files: [''],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: ['src/another/some-component/index.ts'],
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['src'],
      })

      expect(failMock).not.toHaveBeenCalled()
    })

    it("requires non-component's dir name to be in lower case", () => {
      // @ts-ignore
      fs.readFileSync.mockImplementation(() => '')

      dirNameRestrictions({
        danger: {
          git: {
            created_files: ['src/Some-component/index.ts'],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: ['src/another/Another-Component/index.ts'],
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['src'],
      })

      expect(failMock).toHaveBeenCalledTimes(2)
    })

    it('applies restrictions only to files in includePaths, and not to files from excludePaths', () => {
      // @ts-ignore
      fs.readFileSync.mockImplementation((path: string) => {
        if (path === 'app/src/Some-Component/index.tsx') {
          return validReactComponent
        }
      })

      dirNameRestrictions({
        danger: {
          git: {
            created_files: ['app/src/Some-Component/index.tsx', 'app/some-other-file.tsx'],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: ['app/src/hasura/migrations/1616750931272_set_fk_public_userWorkspace_userId/up.sql'],
          },
        } as DangerDSLType,

        excludePaths: ['app/src/hasura'],
        fail: failMock,
        includePaths: ['app/src'],
      })

      expect(failMock).toHaveBeenCalledTimes(1)
      failMock.mockReset()

      dirNameRestrictions({
        danger: {
          git: {
            created_files: ['app/src/Some-Component/index.tsx', 'app/some-other-file.tsx'],

            fileMatch: (file: string) => ({
              getKeyedPaths: () => ({created: [''], edited: [file]}),
            }),

            modified_files: ['app/src/hasura/migrations/1616750931272_set_fk_public_userWorkspace_userId/up.sql'],
          },
        } as DangerDSLType,

        fail: failMock,
        includePaths: ['app/src'],
      })

      expect(failMock).toHaveBeenCalledTimes(3)
    })
  })

  describe('Check for test coverage', () => {
    const fsMock = (path: string) => {
      switch (path) {
        case 'src/ComponentWithInvalidTest/__tests__/index.tsx':
          return "import {SomeOtherStuff} from '../index'"
        case 'src/ComponentWithInvalidTest/index.tsx':
          return 'const ComponentWithInvalidTest = memo(function NewComponent() { return null })'
        case 'src/ComponentWithNoDescribeInTest/__tests__/index.tsx':
          return "import {ComponentWithNoDescribeInTest} from '../index'"
        case 'src/ComponentWithNoDescribeInTest/index.tsx':
          return 'const ComponentWithNoDescribeInTest = memo(function NewComponent() { return null })'
        case 'src/ComponentWithNoImportInTest/__tests__/index.tsx':
          return "describe('"
        case 'src/ComponentWithNoImportInTest/index.tsx':
          return validReactComponent
        case 'src/ComponentWithoutTestFile/index.tsx':
          return validReactComponent
        case 'src/ComponentWithValidTest/__tests__/index.tsx':
          return "import {ComponentWithValidTest} from '../index'\ndescribe('"
        case 'src/ComponentWithValidTest/index.tsx':
          return validReactComponent

        default: {
          let error: Error & {code?: string} = new Error()
          error.code = 'ENOENT'
          throw error
        }
      }
    }

    const ruleParams = (componentName: string) => ({
      danger: {
        git: {
          created_files: [`src/${componentName}/index.tsx`],
          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),
          modified_files: [] as Array<string>,
        },
      } as DangerDSLType,

      fail: failMock,
      includePaths: ['src'],
    })

    beforeEach(() => {
      jest.resetAllMocks()

      // @ts-ignore
      fs.readFileSync.mockImplementation(fsMock)
    })

    it('does not fail on a React component with basic tests', () => {
      componentHasTests(ruleParams('ComponentWithValidTest'))
      expect(failMock).not.toHaveBeenCalled()
    })

    it('fails on a React component with no test file inside __tests__ folder', () => {
      componentHasTests(ruleParams('ComponentWithoutTestFile'))
      expect(failMock).toHaveBeenCalledTimes(1)
    })

    it('fails on a React component with a test file that has no component import', () => {
      componentHasTests(ruleParams('ComponentWithNoImportInTest'))
      expect(failMock).toHaveBeenCalledTimes(1)
    })

    it('fails on a React component with a test file that has no describe block', () => {
      componentHasTests(ruleParams('ComponentWithNoDescribeInTest'))
      expect(failMock).toHaveBeenCalledTimes(1)
    })

    it('fails twice on a React component with a test file that has no component import and no describe block', () => {
      componentHasTests(ruleParams('ComponentWithInvalidTest'))
      expect(failMock).toHaveBeenCalledTimes(2)
    })
  })
})
