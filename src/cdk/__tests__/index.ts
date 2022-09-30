import type {DangerDSLType, TextDiff} from 'danger'
import * as R from 'ramda'
import * as utils from 'utils'
import {nagSuppression} from '..'

jest.mock('utils')

describe('The rule that warns on every NagSuppressions.addResourceSuppressions() invocation', () => {
  const edited = 'some/nested/edited'
  const notEdited = 'some/nested/not-edited'
  const includePaths = ['some-dir', edited, notEdited]
  const filteredPaths = R.map((folder) => `${folder}/index.ts`, includePaths)

  const filterPathsMock = utils.filterPaths as jest.Mock<Array<string>, [params: Omit<utils.RuleParamsBase, 'fail'>]>
  const diffForFileMock = jest.fn<Promise<TextDiff>, [filename: string]>()
  const failMock = jest.fn<void, [string]>()

  const danger = {git: {diffForFile: diffForFileMock}} as unknown as DangerDSLType

  beforeEach(() => {
    filterPathsMock.mockReturnValue(filteredPaths)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('does not check files outside "includePaths"', async () => {
    filterPathsMock.mockReturnValue([])

    await nagSuppression({danger, fail: failMock, includePaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).not.toHaveBeenCalled()
    expect(failMock).not.toHaveBeenCalled()
  })

  it('does not check files with unexpected extension', async () => {
    filterPathsMock.mockReturnValue(R.map((folder) => `${folder}/style.css`, includePaths))

    await nagSuppression({danger, fail: failMock, includePaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).not.toHaveBeenCalled()
    expect(failMock).not.toHaveBeenCalled()
  })

  it('does not check files within "excludeFiles', async () => {
    await nagSuppression({danger, fail: failMock, includePaths, excludeFiles: filteredPaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).not.toHaveBeenCalled()
    expect(failMock).not.toHaveBeenCalled()
  })

  it('does not fail if no files contain "addResourceSuppressions" calls', async () => {
    const added = '// No suppressions added'
    diffForFileMock.mockResolvedValue({before: '', after: added, diff: added, added, removed: ''})

    await nagSuppression({danger, fail: failMock, includePaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).toHaveBeenCalledTimes(3)
    expect(failMock).not.toHaveBeenCalled()
  })

  it('fails on files containing "addResourceSuppressions" calls', async () => {
    diffForFileMock.mockImplementation(async (filename: string) => {
      const added = R.startsWith(edited)(filename) ? 'NagSuppressions.addResourceSuppressions(args)' : ''
      return {before: '', after: added, diff: added, added, removed: ''}
    })

    await nagSuppression({danger, fail: failMock, includePaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).toHaveBeenCalledTimes(3)
    expect(failMock).toHaveBeenCalledTimes(1)
    expect(failMock).toHaveBeenCalledWith('Found 1 new NAG suppression calls', 'some/nested/edited/index.ts')
  })

  it('reports multiple suppressions', async () => {
    diffForFileMock.mockImplementation(async (filename: string) => {
      const added = R.startsWith(edited)(filename)
        ? `NagSuppressions.addResourceSuppressions(args)
          doSomething()
          NagSuppressions.addResourceSuppressions(args)`
        : ''

      return {before: '', after: added, diff: added, added, removed: ''}
    })

    await nagSuppression({danger, fail: failMock, includePaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).toHaveBeenCalledTimes(3)
    expect(failMock).toHaveBeenCalledTimes(1)
    expect(failMock).toHaveBeenCalledWith('Found 2 new NAG suppression calls', 'some/nested/edited/index.ts')
  })
})
