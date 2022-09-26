import {DangerDSLType, GitMatchResult, KeyedPaths, MatchResult, TextDiff} from 'danger'
import {nagSuppression} from '../'

describe('The rule that warns on every NagSuppressions.addResourceSuppressions() invocation', () => {
  const edited = 'some/nested/edited'
  const notEdited = 'some/nested/not-edited'
  const includePaths = ['some-dir', edited, notEdited]
  const fileMatchMock = jest.fn<MatchResult<GitMatchResult>, [...patterns: string[]]>()
  const getKeyedPathsMock = jest.fn<KeyedPaths<GitMatchResult>, []>()
  const diffForFileMock = jest.fn<Promise<TextDiff>, [filename: string]>()
  const failMock = jest.fn<void, [string]>()

  const dangerInstance = (files: Array<string>) =>
    ({
      git: {
        fileMatch: fileMatchMock,
        diffForFile: diffForFileMock,
        created_files: files,
        modified_files: [],
      },
    } as unknown as DangerDSLType)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('does nothing if no files are within defined filter rules', async () => {
    nagSuppression({
      danger: dangerInstance(['src/index.ts']),
      fail: failMock,
      includePaths,
    })

    expect(fileMatchMock).not.toHaveBeenCalled()
    expect(getKeyedPathsMock).not.toHaveBeenCalled()
    expect(diffForFileMock).not.toHaveBeenCalled()
    expect(failMock).not.toHaveBeenCalled()
  })
})
