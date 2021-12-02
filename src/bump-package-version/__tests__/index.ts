import {DangerDSLType, GitDSL, JSONDiff} from 'danger'
import {bumpPackageVersion} from '../index'
jest.mock('fs')

describe('The rule that requires bumping the version in package.json in every pull request', () => {
  it(
    'compares the version in the PR diff and throws a message if the package.json:version has not changed',

    async () => {
      const includePaths = ['some-dir', 'some/nested/one']
      const failMock = jest.fn()

      await bumpPackageVersion({
        danger: {
          git: {
            fileMatch: (path: string) => ({edited: path.startsWith(includePaths[1])}),

            // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
            JSONDiffForFile: async (filename: string): Promise<JSONDiff> => ({
              version: {added: [], after: '0.0.1', before: '0.0.1', removed: []},
            }),
          } as GitDSL,
          github: {pr: {base: {ref: 'main'}}},
        } as DangerDSLType,

        fail              : failMock,
        includePaths,
        restrictToBranches: ['main'],
      })

      expect(failMock).toHaveBeenCalledTimes(1)
      failMock.mockReset()

      await bumpPackageVersion({
        danger: {
          git: {
            fileMatch: (path: string) => ({edited: path.startsWith(includePaths[1])}),

            // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
            JSONDiffForFile: async (filename: string): Promise<JSONDiff> => ({
              version: {added: [], after: '0.0.1', before: '0.2.0', removed: []},
            }),
          } as GitDSL,
          github: {pr: {base: {ref: 'main'}}},
        } as DangerDSLType,

        fail              : failMock,
        includePaths,
        restrictToBranches: ['main'],
      })

      expect(failMock).toHaveBeenCalledTimes(0)
    },
  )
})
