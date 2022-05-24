import {DangerDSLType} from 'danger'
import * as R from 'ramda'
import {codegenMissing, squashMigrations} from '../index'

describe('Hasura rules', () => {
  describe('Squash migrations', () => {
    it('throws a warn if the number of migrations submitted is higher than limit', () => {
      const warnMock = jest.fn()

      squashMigrations({
        danger: {
          git: {
            fileMatch: () => ({
              edited: true,

              getKeyedPaths: () => ({
                edited: [
                  'hasura/migrations/1/up',
                  'hasura/migrations/1/down',
                  'hasura/migrations/2/up',
                  'hasura/migrations/2/down',
                  'hasura/migrations/3/up',
                  'hasura/migrations/3/down',
                  'hasura/migrations/4/up',
                  'hasura/migrations/4/down',
                  'hasura/migrations/5/up',
                  'hasura/migrations/5/down',
                  'hasura/migrations/6/up',
                  'hasura/migrations/6/down',
                ],
              }),
            }),
          },
        } as DangerDSLType,

        hasuraMigrationsPath: 'hasura/migrations',
        maxMigrationsLimit: 10,
        warn: warnMock,
      })

      expect(warnMock).toHaveBeenCalled()
      warnMock.mockReset()

      squashMigrations({
        danger: {
          git: {
            fileMatch: () => ({
              edited: true,

              getKeyedPaths: () => ({
                edited: [
                  'src/some-file/index.tsx',
                  'hasura/migrations/1/up',
                  'hasura/migrations/1/down',
                  'hasura/migrations/2/up',
                  'hasura/migrations/2/down',
                  'hasura/migrations/3/up',
                  'hasura/migrations/3/down',
                  'hasura/migrations/4/up',
                  'hasura/migrations/4/down',
                ],
              }),
            }),
          },
        } as DangerDSLType,

        hasuraMigrationsPath: 'hasura/migrations',
        maxMigrationsLimit: 10,
        warn: warnMock,
      })

      expect(warnMock).not.toHaveBeenCalled()
    })
  })

  describe('Codegen missing', () => {
    it('throws a warn if there are Hasura migrations updates but no schema and codegen generated types updates', () => {
      const warnMock = jest.fn()
      const codegenFileExtension = 'generated.ts'
      const codegenPaths = ['generated', 'graphql']
      const hasuraMigrationsPath = 'hasura/migrations'
      const schemaPath = 'src/schema.json'

      // Neither codegen files nor schema were edited
      codegenMissing({
        codegenFileExtension,
        codegenPaths,

        danger: {
          git: {
            fileMatch: (path: string) => {
              if (path === `${hasuraMigrationsPath}/**/*`) {
                return {
                  edited: true,
                  getKeyedPaths: () => ({edited: ['hasura/migrations/1/up', 'hasura/migrations/1/down']}),
                }
              }

              return {edited: false}
            },
          },
        } as DangerDSLType,

        hasuraMigrationsPath,
        schemaPath: 'src/schema.json',
        warn: warnMock,
      })

      expect(warnMock).toHaveBeenCalledWith('Found Hasura migrations but no changes in codegen files and schema.json')
      warnMock.mockReset()

      // Schema was not edited
      codegenMissing({
        codegenFileExtension,
        codegenPaths,

        danger: {
          git: {
            fileMatch: (path: string) => {
              if (path === `${hasuraMigrationsPath}/**/*`) {
                return {
                  edited: true,
                  getKeyedPaths: () => ({edited: ['hasura/migrations/1/up', 'hasura/migrations/1/down']}),
                }
              }

              if (R.any((codegenPath) => path === `${codegenPath}/**/*.${codegenFileExtension}`, codegenPaths)) {
                return {
                  edited: true,

                  getKeyedPaths: () => ({
                    edited: [
                      'frontend/src/generated/index.generated.ts',
                      'frontend/src/SomeComponent/graphql/query.generated.ts',
                    ],
                  }),
                }
              }

              return {edited: false}
            },
          },
        } as DangerDSLType,

        hasuraMigrationsPath,
        schemaPath,
        warn: warnMock,
      })

      expect(warnMock).toHaveBeenCalledWith('Found Hasura migrations but no changes in schema.json')
      warnMock.mockReset()

      // Codegen files were not edited
      codegenMissing({
        codegenFileExtension,
        codegenPaths,

        danger: {
          git: {
            fileMatch: (path: string) => {
              if (path === `${hasuraMigrationsPath}/**/*`) {
                return {
                  edited: true,
                  getKeyedPaths: () => ({edited: ['hasura/migrations/1/up', 'hasura/migrations/1/down']}),
                }
              }

              if (path === schemaPath) {
                return {edited: true, getKeyedPaths: () => ({edited: [schemaPath]})}
              }

              return {edited: false}
            },
          },
        } as DangerDSLType,

        hasuraMigrationsPath,
        schemaPath,
        warn: warnMock,
      })

      expect(warnMock).toHaveBeenCalledWith('Found Hasura migrations but no changes in codegen files')
      warnMock.mockReset()

      // All changes in place
      codegenMissing({
        codegenFileExtension,
        codegenPaths,

        danger: {
          git: {
            fileMatch: () => ({
              edited: true,
              getKeyedPaths: () => ({edited: ['hasura/migrations/1/up', 'hasura/migrations/1/down']}),
            }),
          },
        } as DangerDSLType,

        hasuraMigrationsPath,
        schemaPath,
        warn: warnMock,
      })

      expect(warnMock).not.toHaveBeenCalled()
    })
  })
})
