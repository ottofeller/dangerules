import type {DangerDSLType} from 'danger'

export type FilterParams = {
  /**
   * The Danger DSL instance.
   */
  danger: DangerDSLType

  /**
   * Path to exclude from search.
   */
  excludePaths?: Array<string>

  /**
   * Path to include into search.
   */
  includePaths: Array<string>
}
