import {DangerDSLType} from "danger"

export type RuleParamsBase = {
  danger: DangerDSLType
  excludePaths?: Array<string>
  fail: (message: string) => void
  includePaths: Array<string>
}
