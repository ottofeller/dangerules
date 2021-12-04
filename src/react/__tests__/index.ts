/* eslint-disable max-lines */
import * as fs from 'fs'
import {componentHasTests, dirNameRestrictions} from '../index'
import {DangerDSLType} from 'danger'
jest.mock('fs')

describe('React rules', () => {
  const failMock = jest.fn()

  describe('Restrictions on the dir name', () => {
    it('requires component\'s dir name to have first letter capitalized', () => {
      // @ts-ignore
      fs.readFileSync.mockImplementation((path: string) => {
        if(path === 'src/component/index.tsx' || path === 'src/another/Component/index.tsx') {
          return 'const SomeCompnent = memo(function NewComponent() { return null })'
        }
      })

      dirNameRestrictions({
        danger: {git: {
          created_files: ['src/component/index.ts'],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/Component/index.ts'],
        }} as DangerDSLType,

        fail        : failMock,
        includePaths: ['src'],
      })

      expect(failMock).toHaveBeenCalled()
      failMock.mockReset()

      dirNameRestrictions({
        danger: {git: {
          created_files: [''],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/Component/index.ts'],
        }} as DangerDSLType,

        fail        : failMock,
        includePaths: ['src'],
      })

      expect(failMock).not.toHaveBeenCalled()
      failMock.mockReset()

      // @ts-ignore
      fs.readFileSync.mockImplementation(() => 'const someExport = 1')

      dirNameRestrictions({
        danger: {git: {
          created_files: [''],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/some-non-component/index.tsx'],
        }} as DangerDSLType,

        fail        : failMock,
        includePaths: ['src'],
      })

      expect(failMock).not.toHaveBeenCalled()
    })

    it('requires component\'s dir name to be in camel case', () => {
      // @ts-ignore
      fs.readFileSync.mockImplementation(() => 'const SomeCompnent = memo(function NewComponent() { return null })')

      dirNameRestrictions({
        danger: {git: {
          created_files: ['src/somComponent/index.ts'],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/SomeComponent/index.ts'],
        }} as DangerDSLType,

        fail        : failMock,
        includePaths: ['src'],
      })

      expect(failMock).toHaveBeenCalled()
      failMock.mockReset()

      // @ts-ignore
      fs.readFileSync.mockImplementation((path: string) => {
        if(path === 'src/another/SomeComponent/index.tsx') {
          return 'const SomeCompnent = memo(function NewComponent() { return null })'
        }
      })

      dirNameRestrictions({
        danger: {git: {
          created_files: [''],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/SomeComponent/index.ts'],
        }} as DangerDSLType,

        fail        : failMock,
        includePaths: ['src'],
      })

      expect(failMock).not.toHaveBeenCalled()
    })

    it('requires non-component\'s dir name to be in dash case', () => {
      failMock.mockReset()

      // @ts-ignore
      fs.readFileSync.mockImplementation(() => '')

      dirNameRestrictions({
        danger: {git: {
          created_files: ['src/someComponent/index.ts'],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/SomeComponent/index.ts'],
        }} as DangerDSLType,

        fail        : failMock,
        includePaths: ['src'],
      })

      expect(failMock).toHaveBeenCalled()
      failMock.mockReset()

      dirNameRestrictions({
        danger: {git: {
          created_files: [''],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/some_component/index.ts'],
        }} as DangerDSLType,

        fail        : failMock,
        includePaths: ['src'],
      })

      expect(failMock).toHaveBeenCalled()
      failMock.mockReset()

      dirNameRestrictions({
        danger: {git: {
          created_files: [''],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/some-component/index.ts'],
        }} as DangerDSLType,

        fail        : failMock,
        includePaths: ['src'],
      })

      expect(failMock).not.toHaveBeenCalled()
    })

    it('requires non-component\'s dir name to be in lower case', () => {
      failMock.mockReset()

      // @ts-ignore
      fs.readFileSync.mockImplementation(() => '')

      dirNameRestrictions({
        danger: {git: {
          created_files: ['src/Some-component/index.ts'],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/Another-Component/index.ts'],
        }} as DangerDSLType,

        fail        : failMock,
        includePaths: ['src'],
      })

      expect(failMock).toHaveBeenCalledTimes(2)
    })

    it('applies restrictions only to files in includePaths, and not to files from excludePaths', () => {
      failMock.mockReset()

      // @ts-ignore
      fs.readFileSync.mockImplementation((path: string) => {
        if(path === 'app/src/Some-Component/index.tsx') {
          return 'const SomeCompnent = memo(function NewComponent() { return null })'
        }
      })

      dirNameRestrictions({
        danger: {git: {
          created_files: [
            'app/src/Some-Component/index.tsx',
            'app/some-other-file.tsx',
          ],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['app/src/hasura/migrations/1616750931272_set_fk_public_userWorkspace_userId/up.sql'],
        }} as DangerDSLType,

        excludePaths: ['app/src/hasura'],
        fail        : failMock,
        includePaths: ['app/src'],
      })

      expect(failMock).toHaveBeenCalledTimes(1)
      failMock.mockReset()

      dirNameRestrictions({
        danger: {git: {
          created_files: [
            'app/src/Some-Component/index.tsx',
            'app/some-other-file.tsx',
          ],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['app/src/hasura/migrations/1616750931272_set_fk_public_userWorkspace_userId/up.sql'],
        }} as DangerDSLType,

        fail        : failMock,
        includePaths: ['app/src'],
      })

      expect(failMock).toHaveBeenCalledTimes(3)
    })
  })

  describe('Check for test coverage', () => {
    const fsMock = (path: string) => {
      switch(path){
      case'src/ComponentWithInvalidTest/__tests__/index.tsx': 
        return 'import {SomeOtherStuff} from \'../index\''
      case'src/ComponentWithInvalidTest/index.tsx':
        return 'const ComponentWithInvalidTest = memo(function NewComponent() { return null })'
      case'src/ComponentWithNoDescribeInTest/__tests__/index.tsx':
        return 'import {ComponentWithNoDescribeInTest} from \'../index\''
      case'src/ComponentWithNoDescribeInTest/index.tsx':
        return 'const ComponentWithNoDescribeInTest = memo(function NewComponent() { return null })'
      case'src/ComponentWithNoImportInTest/__tests__/index.tsx':
        return 'describe(\''
      case'src/ComponentWithNoImportInTest/index.tsx':
        return 'const ComponentWithNoImportInTest = memo(function NewComponent() { return null })'
      case'src/ComponentWithoutTestFile/index.tsx':
        return 'const SomeCompnent = memo(function NewComponent() { return null })'
      case'src/ComponentWithValidTest/__tests__/index.tsx':
        return 'import {ComponentWithValidTest} from \'../index\'/ndescribe(\''
      case'src/ComponentWithValidTest/index.tsx':
        return 'const ComponentWithValidTest = memo(function NewComponent() { return null })'

      default: {
        let error: Error & { code?: string } = new Error()
        error.code = 'ENOENT'
        throw error
      }}
    }

    const ruleParams = (componentName: string) => ({
      danger: {
        git: {
          created_files: [`src/${componentName}/index.tsx`],
          fileMatch    : (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),
          modified_files: [] as Array<string>,
        },
      } as DangerDSLType,

      fail        : failMock,
      includePaths: ['src'],
    })

    beforeEach(() => {
      failMock.mockReset()
      jest.resetModules()

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
