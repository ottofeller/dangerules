import {DangerDSLType} from 'danger'
import {squashMigrations} from '../index'

describe('Hasura rules', () => {
  describe('Suggest squashing migrations', () => {
    it('throws a message if the number of migrations submitted is higher than limit', () => {
      const warnMock = jest.fn()

      squashMigrations({
        danger: {git: {
          fileMatch: () => ({
            edited: true,

            getKeyedPaths: () => ({edited: [
              'hasura/migrations/1/up', 'hasura/migrations/1/down', 'hasura/migrations/2/up',
              'hasura/migrations/2/down', 'hasura/migrations/3/up', 'hasura/migrations/3/down',
              'hasura/migrations/4/up', 'hasura/migrations/4/down', 'hasura/migrations/5/up',
              'hasura/migrations/5/down', 'hasura/migrations/6/up', 'hasura/migrations/6/down',
            ]}),
          }),
        }} as DangerDSLType,
        
        hasuraMigrationsPath: 'hasura/migrations',
        maxMigrationsLimit  : 10,
        warn                : warnMock,
      })

      expect(warnMock).toHaveBeenCalled()
      warnMock.mockReset()

      squashMigrations({
        danger: {git: {
          fileMatch: () => ({
            edited: true,

            getKeyedPaths: () => ({edited: [
              'src/some-file/index.tsx', 'hasura/migrations/1/up', 'hasura/migrations/1/down', 'hasura/migrations/2/up',
              'hasura/migrations/2/down', 'hasura/migrations/3/up', 'hasura/migrations/3/down',
              'hasura/migrations/4/up', 'hasura/migrations/4/down', 
            ]}),
          }),
        }} as DangerDSLType,
        
        hasuraMigrationsPath: 'hasura/migrations',
        maxMigrationsLimit  : 10,
        warn                : warnMock,
      })

      expect(warnMock).not.toHaveBeenCalled()
    })
  })
})
