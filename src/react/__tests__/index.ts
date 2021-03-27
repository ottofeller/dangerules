import * as fs from 'fs'
import {DangerDSLType} from 'danger'
import {dirNameRestrictions} from '../index'
jest.mock('fs')

describe('React rules', () => {
  describe('Restrictions on the dir name', () => {
    const failMock = jest.fn()

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
})
