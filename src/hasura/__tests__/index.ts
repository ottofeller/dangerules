import {DangerDSLType, MarkdownString} from 'danger'
import {readFileSync} from 'fs'
import * as R from 'ramda'
import {codegenMissing, squashMigrations, migrationTableChange} from '../index'

jest.mock('fs')

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

  describe('Table change rule', () => {
    const warnMock = jest.fn<void, [message: MarkdownString, file?: string, line?: number]>()
    const mockedReadFileSync = readFileSync as unknown as jest.Mock<
      string,
      [path: string, options: {encoding: BufferEncoding; flag?: string | undefined} | BufferEncoding]
    >
    const dangerMock = (editedFiles?: string[]) =>
      ({
        git: {
          fileMatch: () => ({
            edited: !!editedFiles && editedFiles.length > 0,
            getKeyedPaths: () => ({edited: editedFiles || []}),
          }),
        },
      } as DangerDSLType)

    afterEach(() => {
      warnMock.mockClear()
      mockedReadFileSync.mockClear()
    })

    afterAll(() => {
      warnMock.mockReset()
      mockedReadFileSync.mockReset()
    })

    it('does nothing if no migration files are edited', () => {
      migrationTableChange({
        danger: dangerMock(),
        hasuraMigrationsPath: 'hasura/migrations',
        warn: warnMock,
      })

      expect(warnMock).toHaveBeenCalledTimes(0)
    })

    it('does not warn if no breaking changes introduced', () => {
      mockedReadFileSync.mockReturnValue('CREATE TABLE users; ALTER TABLE users ADD COLUMN address;')

      migrationTableChange({
        danger: dangerMock(['hasura/migrations/1/up']),
        hasuraMigrationsPath: 'hasura/migrations',
        warn: warnMock,
      })

      expect(warnMock).toHaveBeenCalledTimes(0)
    })

    it('warns if a field is renamed', () => {
      mockedReadFileSync.mockReturnValue('ALTER TABLE users RENAME COLUMN name; ALTER TABLE users ADD COLUMN address;')

      migrationTableChange({
        danger: dangerMock(['hasura/migrations/1/up']),
        hasuraMigrationsPath: 'hasura/migrations',
        warn: warnMock,
      })

      expect(warnMock).toHaveBeenCalledTimes(1)
      expect(warnMock).toHaveBeenCalledWith('Found Hasura migration renaming a field', 'hasura/migrations/1/up')
    })

    it('warns if a field is removed', () => {
      mockedReadFileSync.mockReturnValue('ALTER TABLE users DROP COLUMN name; ALTER TABLE users ADD COLUMN address;')

      migrationTableChange({
        danger: dangerMock(['hasura/migrations/1/up']),
        hasuraMigrationsPath: 'hasura/migrations',
        warn: warnMock,
      })

      expect(warnMock).toHaveBeenCalledTimes(1)
      expect(warnMock).toHaveBeenCalledWith('Found Hasura migration removing a field', 'hasura/migrations/1/up')
    })

    it('warns if an existing field has acquired a "NOT NULL" constraint', () => {
      mockedReadFileSync.mockReturnValue(
        'ALTER TABLE users ADD COLUMN address; ALTER TABLE users ALTER COLUMN address DROP NOT NULL;',
      )

      migrationTableChange({
        danger: dangerMock(['hasura/migrations/1/up']),
        hasuraMigrationsPath: 'hasura/migrations',
        warn: warnMock,
      })

      expect(warnMock).toHaveBeenCalledTimes(1)
      expect(warnMock).toHaveBeenCalledWith(
        'Found Hasura migration removing "NOT NULL" constraint',
        'hasura/migrations/1/up',
      )
    })

    it('warns only for files with undesirable changes', () => {
      mockedReadFileSync.mockImplementation(
        (path: string) =>
          ({
            'hasura/migrations/1/up':
              'CREATE TABLE users; ALTER TABLE users ADD COLUMN name; ALTER TABLE users ADD address Integer NOT NULL DEFAULT "0";',
            'hasura/migrations/2/up': 'ALTER TABLE users ALTER COLUMN address DROP NOT NULL;',
            'hasura/migrations/3/up': 'ALTER TABLE users DROP COLUMN address; ALTER TABLE users DROP COLUMN name;',
            'hasura/migrations/4/up': 'ALTER TABLE users ADD COLUMN name;',
          }[path] || ''),
      )

      migrationTableChange({
        danger: dangerMock([
          'src/index.tsx',
          'hasura/migrations/1/up',
          'hasura/migrations/2/up',
          'hasura/migrations/3/up',
          'hasura/migrations/4/up',
        ]),
        hasuraMigrationsPath: 'hasura/migrations',
        warn: warnMock,
      })

      expect(warnMock).toHaveBeenCalledTimes(3)
      expect(warnMock).toHaveBeenNthCalledWith(
        1,
        'Found Hasura migration removing "NOT NULL" constraint',
        'hasura/migrations/2/up',
      )
      expect(warnMock).toHaveBeenNthCalledWith(2, 'Found Hasura migration removing a field', 'hasura/migrations/3/up')
      expect(warnMock).toHaveBeenNthCalledWith(3, 'Found Hasura migration removing a field', 'hasura/migrations/3/up')
    })
  })
})
