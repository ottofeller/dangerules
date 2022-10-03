import {DangerDSLType, fail} from 'danger'

export type RuleParamsBase = {
  /**
   * The Danger DSL instance.
   */
  danger: DangerDSLType

  /**
   * Path to exclude from search.
   */
  excludePaths?: Array<string>

  /**
   * A function that either fails a build or highlights an issue.
   */
  fail: typeof fail

  /**
   * Path to include into search.
   */
  includePaths: Array<string>
}
