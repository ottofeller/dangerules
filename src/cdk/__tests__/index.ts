import type {DangerDSLType, StructuredDiff} from 'danger'
import type {AddChange, Chunk, NormalChange} from 'parse-diff'
import * as R from 'ramda'
import * as utils from 'utils'
import {nagSuppression} from '..'

jest.mock('utils')

describe('The rule that warns on every NagSuppressions.addResourceSuppressions() invocation', () => {
  const edited = 'some/nested/edited'
  const notEdited = 'some/nested/not-edited'
  const includePaths = ['some-dir', edited, notEdited]
  const filteredPaths = R.map((folder) => `${folder}/index.ts`, includePaths)
  const [, editedFilePath] = filteredPaths

  const normalChange: NormalChange = {type: 'normal', ln1: 0, ln2: 0, normal: true, content: ''}
  const emptyChunk: Chunk = {content: '', changes: [normalChange], oldStart: 0, oldLines: 0, newStart: 0, newLines: 0}

  const filterPathsMock = utils.filterPaths as jest.Mock<Array<string>, [params: utils.FilterParams]>
  const diffForFileMock = jest.fn<Promise<StructuredDiff>, [filename: string]>()
  const warnMock = jest.fn<void, [string]>()

  const danger = {git: {structuredDiffForFile: diffForFileMock}} as unknown as DangerDSLType

  beforeEach(() => {
    filterPathsMock.mockReturnValue(filteredPaths)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('does not check files outside "includePaths"', async () => {
    filterPathsMock.mockReturnValue([])

    await nagSuppression({danger, warn: warnMock, includePaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).not.toHaveBeenCalled()
    expect(warnMock).not.toHaveBeenCalled()
  })

  it('does not check files with unexpected extension', async () => {
    filterPathsMock.mockReturnValue(R.map((folder) => `${folder}/style.css`, includePaths))

    await nagSuppression({danger, warn: warnMock, includePaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).not.toHaveBeenCalled()
    expect(warnMock).not.toHaveBeenCalled()
  })

  it('does not check files within "excludeFiles', async () => {
    await nagSuppression({danger, warn: warnMock, includePaths, excludeFiles: filteredPaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).not.toHaveBeenCalled()
    expect(warnMock).not.toHaveBeenCalled()
  })

  it('does not warn if no files contain "addResourceSuppressions" calls', async () => {
    const added = '// No suppressions added'
    const addChange: AddChange = {type: 'add', add: true, ln: 2, content: added}
    const chunk: Chunk = {...emptyChunk, changes: emptyChunk.changes.concat(addChange)}

    diffForFileMock.mockResolvedValue({chunks: [chunk]})

    await nagSuppression({danger, warn: warnMock, includePaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).toHaveBeenCalledTimes(3)
    expect(warnMock).not.toHaveBeenCalled()
  })

  it('warns on files containing "addResourceSuppressions" calls', async () => {
    diffForFileMock.mockImplementation(async (filename: string) => {
      const added = R.startsWith(edited)(filename) ? 'NagSuppressions.addResourceSuppressions(args)' : ''
      const addChange: AddChange = {type: 'add', add: true, ln: 2, content: added}
      const chunk: Chunk = {...emptyChunk, changes: emptyChunk.changes.concat(addChange)}
      return {chunks: [chunk]}
    })

    await nagSuppression({danger, warn: warnMock, includePaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).toHaveBeenCalledTimes(3)
    expect(warnMock).toHaveBeenCalledTimes(1)
    expect(warnMock).toHaveBeenCalledWith(
      `Found new NAG suppression call in file "${editedFilePath}" at line ${2}`,
      editedFilePath,
      2,
    )
  })

  it('reports multiple suppressions', async () => {
    diffForFileMock.mockImplementation(async (filename: string) => {
      const added = R.startsWith(edited)(filename) ? 'NagSuppressions.addResourceSuppressions(args)' : ''
      const addChange1: AddChange = {type: 'add', add: true, ln: 2, content: added}
      const addChange2: AddChange = {type: 'add', add: true, ln: 7, content: added}
      const chunk: Chunk = {...emptyChunk, changes: emptyChunk.changes.concat(addChange1, addChange2)}
      return {chunks: [chunk]}
    })

    await nagSuppression({danger, warn: warnMock, includePaths})

    expect(filterPathsMock).toHaveBeenCalledTimes(1)
    expect(diffForFileMock).toHaveBeenCalledTimes(3)
    expect(warnMock).toHaveBeenCalledTimes(2)

    expect(warnMock).toHaveBeenNthCalledWith(
      1,
      `Found new NAG suppression call in file "${editedFilePath}" at line ${2}`,
      editedFilePath,
      2,
    )

    expect(warnMock).toHaveBeenNthCalledWith(
      2,
      `Found new NAG suppression call in file "${editedFilePath}" at line ${7}`,
      editedFilePath,
      7,
    )
  })
})
