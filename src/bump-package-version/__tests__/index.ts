import {DangerDSLType, GitMatchResult, JSONDiff, KeyedPaths, MatchResult} from 'danger'
import {bumpPackageVersion} from '../index'

describe('The rule that requires bumping the version in package.json in every pull request', () => {
  const edited = 'some/nested/edited'
  const notEdited = 'some/nested/not-edited'
  const includePaths = ['some-dir', edited, notEdited]
  const fileMatchMock = jest.fn<MatchResult<GitMatchResult>, [string[]]>()
  const getKeyedPathsMock = jest.fn<KeyedPaths<GitMatchResult>, []>()
  const JSONDiffForFileMock = jest.fn<Promise<JSONDiff>, [string]>()
  const failMock = jest.fn<void, [string]>()

  const dangerInstance = (ref: string) =>
    ({
      git: {
        fileMatch: fileMatchMock,
        JSONDiffForFile: JSONDiffForFileMock,
      },
      github: {pr: {base: {ref}}},
    } as unknown as DangerDSLType)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('does not run on PR on a branch other than listed in restrictToBranches', async () => {
    await bumpPackageVersion({
      danger: dangerInstance('secondary-branch'),
      fail: failMock,
      includePaths,
      restrictToBranches: ['main'],
    })

    expect(fileMatchMock).not.toHaveBeenCalled()
    expect(getKeyedPathsMock).not.toHaveBeenCalled()
    expect(JSONDiffForFileMock).not.toHaveBeenCalled()
    expect(failMock).not.toHaveBeenCalled()
  })

  it('does not run if no edited files found', async () => {
    fileMatchMock.mockReturnValueOnce({
      edited: false,
      getKeyedPaths: getKeyedPathsMock,
    } as unknown as MatchResult<GitMatchResult>)

    await bumpPackageVersion({
      danger: dangerInstance('main'),
      fail: failMock,
      includePaths,
      restrictToBranches: ['main'],
    })

    expect(fileMatchMock).toHaveBeenCalledTimes(1)
    expect(getKeyedPathsMock).not.toHaveBeenCalled()
    expect(JSONDiffForFileMock).not.toHaveBeenCalled()
    expect(failMock).not.toHaveBeenCalled()
  })

  it('does not run if required paths are not edited', async () => {
    fileMatchMock
      .mockReturnValueOnce({
        edited: true,
        getKeyedPaths: getKeyedPathsMock,
      } as unknown as MatchResult<GitMatchResult>)
      .mockReturnValueOnce({
        edited: false,
      } as unknown as MatchResult<GitMatchResult>)

    getKeyedPathsMock.mockReturnValueOnce({
      edited: [edited],
    } as KeyedPaths<GitMatchResult>)

    await bumpPackageVersion({
      danger: dangerInstance('main'),
      fail: failMock,
      includePaths,
      restrictToBranches: ['main'],
    })

    expect(fileMatchMock).toHaveBeenCalledTimes(2)
    expect(getKeyedPathsMock).toHaveBeenCalled()
    expect(JSONDiffForFileMock).not.toHaveBeenCalled()
    expect(failMock).not.toHaveBeenCalled()
  })

  it('fails on edited files and not updated package.json', async () => {
    fileMatchMock
      .mockReturnValueOnce({
        edited: true,
        getKeyedPaths: getKeyedPathsMock,
      } as unknown as MatchResult<GitMatchResult>)
      .mockReturnValueOnce({
        edited: true,
      } as unknown as MatchResult<GitMatchResult>)

    getKeyedPathsMock.mockReturnValueOnce({
      edited: [edited],
    } as KeyedPaths<GitMatchResult>)

    JSONDiffForFileMock.mockResolvedValueOnce({
      version: {added: [], after: '0.0.1', before: '0.0.1', removed: []},
    } as JSONDiff)

    await bumpPackageVersion({
      danger: dangerInstance('main'),
      fail: failMock,
      includePaths,
      restrictToBranches: ['main'],
    })

    expect(fileMatchMock).toHaveBeenCalledTimes(2)
    expect(getKeyedPathsMock).toHaveBeenCalled()
    expect(JSONDiffForFileMock).toHaveBeenCalled()
    expect(failMock).toHaveBeenCalled()
  })

  it('does not fail on edited files and updated package.json', async () => {
    fileMatchMock
      .mockReturnValueOnce({
        edited: true,
        getKeyedPaths: getKeyedPathsMock,
      } as unknown as MatchResult<GitMatchResult>)
      .mockReturnValueOnce({
        edited: true,
      } as unknown as MatchResult<GitMatchResult>)

    getKeyedPathsMock.mockReturnValueOnce({
      edited: [edited],
    } as KeyedPaths<GitMatchResult>)

    JSONDiffForFileMock.mockResolvedValueOnce({
      version: {added: [], after: '0.0.1', before: '0.2.0', removed: []},
    } as JSONDiff)

    await bumpPackageVersion({
      danger: dangerInstance('main'),
      fail: failMock,
      includePaths,
      restrictToBranches: ['main'],
    })

    expect(fileMatchMock).toHaveBeenCalledTimes(2)
    expect(getKeyedPathsMock).toHaveBeenCalled()
    expect(JSONDiffForFileMock).toHaveBeenCalled()
    expect(failMock).not.toHaveBeenCalled()
  })

  it('does not fail on not updated package.json if edited files are excluded', async () => {
    fileMatchMock
      .mockReturnValueOnce({
        edited: true,
        getKeyedPaths: getKeyedPathsMock,
      } as unknown as MatchResult<GitMatchResult>)
      .mockReturnValueOnce({
        edited: true,
      } as unknown as MatchResult<GitMatchResult>)

    getKeyedPathsMock.mockReturnValueOnce({
      edited: [edited],
    } as KeyedPaths<GitMatchResult>)

    JSONDiffForFileMock.mockResolvedValueOnce({
      version: {added: [], after: '0.0.1', before: '0.0.1', removed: []},
    } as JSONDiff)

    await bumpPackageVersion({
      danger: dangerInstance('main'),
      fail: failMock,
      includePaths,
      excludePaths: [edited],
      restrictToBranches: ['main'],
    })

    expect(fileMatchMock).toHaveBeenCalledTimes(1)
    expect(getKeyedPathsMock).toHaveBeenCalled()
    expect(JSONDiffForFileMock).not.toHaveBeenCalled()
    expect(failMock).not.toHaveBeenCalled()
  })
})
