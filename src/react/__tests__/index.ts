import * as fs from 'fs'
import {componentDirRestrictions} from '../index'
import {DangerDSLType} from 'danger'
jest.mock('fs')

describe('React rules', () => {
  describe('Restrictions on the component\'s dir name', () => {
    it('require component\'s dir name to have first letter capitalized', () => {
      const failMock = jest.fn()

      // @ts-ignore
      fs.readFileSync.mockImplementation((path: string) => {
        if(path === 'src/component/index.tsx' || path === 'src/another/Component/index.tsx') {
          return 'const SomeCompnent = memo(function NewComponent() { return null })'
        }
      })

      componentDirRestrictions({
        danger: {git: {
          created_files: ['src/component/index.ts'],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/Component/index.ts'],
        }} as DangerDSLType,

        fail: failMock,
      })

      expect(failMock).toHaveBeenCalled()
      failMock.mockReset()

      componentDirRestrictions({
        danger: {git: {
          created_files: [''],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/Component/index.ts'],
        }} as DangerDSLType,

        fail: failMock,
      })

      expect(failMock).not.toHaveBeenCalled()
      failMock.mockReset()

      // @ts-ignore
      fs.readFileSync.mockImplementation(() => 'const someExport = 1')

      componentDirRestrictions({
        danger: {git: {
          created_files: [''],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/some-non-component/index.tsx'],
        }} as DangerDSLType,

        fail: failMock,
      })

      expect(failMock).not.toHaveBeenCalled()
    })

    it('require component\'s dir name to be in camel case', () => {
      const failMock = jest.fn()

      // @ts-ignore
      fs.readFileSync.mockImplementation(() => 'const SomeCompnent = memo(function NewComponent() { return null })')

      componentDirRestrictions({
        danger: {git: {
          created_files: ['src/somComponent/index.ts'],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/SomeComponent/index.ts'],
        }} as DangerDSLType,

        fail: failMock,
      })

      expect(failMock).toHaveBeenCalled()
      failMock.mockReset()

      // @ts-ignore
      fs.readFileSync.mockImplementation((path: string) => {
        if(path === 'src/SomeComponent/index.tsx') {
          return 'const SomeCompnent = memo(function NewComponent() { return null })'
        }
      })

      componentDirRestrictions({
        danger: {git: {
          created_files: [''],

          fileMatch: (file: string) => ({
            getKeyedPaths: () => ({created: [''], edited: [file]}),
          }),

          modified_files: ['src/another/SomeComponent/index.ts'],
        }} as DangerDSLType,

        fail: failMock,
      })

      expect(failMock).not.toHaveBeenCalled()
    })
  })
})
