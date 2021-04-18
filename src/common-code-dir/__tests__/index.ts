import * as fs from 'fs'
import * as R from 'ramda'
import {commonCodeDir} from '../index'
import {DangerDSLType} from 'danger'
jest.mock('fs')

describe('Common code dir rule', () => {
  it('throws a failure if there is the same import from non-common dir in more than one file', () => {
    const failMock = jest.fn()

    // @ts-ignore
    fs.readdirSync.mockImplementation((path: string) => {
      /*
        src/
          common/
            helpers/
              some-helper/
                index.tsx
              
              index.tsx

          ComponentA/
            index.tsx

          ComponentB/
            index.tsx
      */
      if(path === 'src/') {
        return ['ComponentA', 'ComponentB', 'common', 'index.tsx']
      }

      if(path === 'src/ComponentA') {
        return ['index.tsx']
      }

      if(path === 'src/ComponentB') {
        return ['index.tsx']
      }

      if(path === 'src/common') {
        return ['helpers']
      }

      if(path === 'src/common/helpers') {
        return ['index.tsx', 'some-helper']
      }

      if(path === 'src/common/helpers/some-helper') {
        return ['index.tsx']
      }
    })

    // @ts-ignore
    fs.statSync.mockImplementation((path: string) => ({isDirectory: () => R.includes(
      path,
      ['src', 'src/ComponentA', 'src/ComponentB', 'src/common', 'src/common/helpers', 'src/common/helpers/some-helper'],
    )}))

    // Named imports case
    // @ts-ignore
    fs.readFileSync.mockImplementation((path: string) => {
      if(R.includes('src/ComponentA/index.tsx', path)) {
        return `
          import {someHelperTwo} from 'some-helper-two'
          import {someHelper} from 'common/helpers'
          import anotherThing from 'another-thing'

          for(let i=0; i < 5; i++) {
            console.log(i)
          }
        `
      }

      if(R.includes('src/ComponentB/index.tsx', path)) {
        return `
          import {someHelperTwo} from '../some-helper-two'
          import {first, someHelper as sh, third} from '../common/helpers'
          import anotherThing from 'another-thing'

          for(let i=0; i < 5; i++) {
            console.log(i)
          }
        `
      }
    })

    commonCodeDir({
      baseImportPath: __dirname.replace('__tests__', 'src'),

      danger: {git: {
        fileMatch: () => ({
          edited       : true,
          getKeyedPaths: () => ({edited: ['src/ComponentA/index.tsx']}),
        }),
      }} as DangerDSLType,
      
      fail        : failMock,
      includePaths: ['src/'],
    })

    expect(failMock).toHaveBeenCalledTimes(2)
    failMock.mockReset()

    // Default imports cas
    // @ts-ignore
    fs.readFileSync.mockImplementation((path: string) => {
      if(R.includes('src/ComponentA/index.tsx', path)) {
        return `
          import {someHelper} from 'common/helpers'
          import anotherThing from 'another-thing'

          for(let i=0; i < 5; i++) {
            console.log(i)
          }
        `
      }

      if(R.includes('src/ComponentB/index.tsx', path)) {
        return `
          import {someHelperTwo} from '../some-helper-two'
          import helpers, {third} from '../common/helpers'
          import anotherThing from 'another-thing'

          for(let i=0; i < 5; i++) {
            console.log(i)
          }
        `
      }
    })

    commonCodeDir({
      baseImportPath: __dirname.replace('__tests__', 'src'),

      danger: {git: {
        fileMatch: () => ({
          edited       : true,
          getKeyedPaths: () => ({edited: ['src/ComponentA/index.tsx']}),
        }),
      }} as DangerDSLType,

      fail        : failMock,
      includePaths: ['src/'],
    })

    expect(failMock).toHaveBeenCalledTimes(1)
  })

  it('doesn\'t throw a fail if all common modules are imported from common/', () => {
    const failMock = jest.fn()

    // @ts-ignore
    fs.readdirSync.mockImplementation((path: string) => {
      /*
        src/
          common/
            helpers/
              some-helper/
                index.tsx
              
              index.tsx

          ComponentA/
            index.tsx

          ComponentB/
            index.tsx
      */
      if(path === 'src/') {
        return ['ComponentA', 'ComponentB', 'common', 'index.tsx']
      }

      if(path === 'src/ComponentA') {
        return ['index.tsx']
      }

      if(path === 'src/ComponentB') {
        return ['index.tsx']
      }

      if(path === 'src/common') {
        return ['helpers']
      }

      if(path === 'src/common/helpers') {
        return ['index.tsx', 'some-helper']
      }

      if(path === 'src/common/helpers/some-helper') {
        return ['index.tsx']
      }
    })

    // @ts-ignore
    fs.statSync.mockImplementation((path: string) => ({isDirectory: () => R.includes(
      path,
      ['src', 'src/ComponentA', 'src/ComponentB', 'src/common', 'src/common/helpers', 'src/common/helpers/some-helper'],
    )}))

    // Named imports case
    // @ts-ignore
    fs.readFileSync.mockImplementation((path: string) => {
      if(R.includes('src/ComponentA/index.tsx', path)) {
        return `
          import {someHelperTwo} from '../common/some-helper-two'
          import {someHelper} from 'common/helpers'
          import anotherThing from 'another-thing'

          for(let i=0; i < 5; i++) {
            console.log(i)
          }
        `
      }

      if(R.includes('src/ComponentB/index.tsx', path)) {
        return `
          import {someHelperTwo} from '../some-helper-two'
          import {first, someHelper as sh, third} from '../common/helpers'

          for(let i=0; i < 5; i++) {
            console.log(i)
          }
        `
      }
    })

    commonCodeDir({
      baseImportPath: __dirname.replace('__tests__', 'src'),

      danger: {git: {
        fileMatch: () => ({
          edited       : true,
          getKeyedPaths: () => ({edited: ['src/ComponentA/index.tsx']}),
        }),
      }} as DangerDSLType,
      
      fail        : failMock,
      includePaths: ['src/'],
    })

    expect(failMock).not.toHaveBeenCalled()
  })
})
