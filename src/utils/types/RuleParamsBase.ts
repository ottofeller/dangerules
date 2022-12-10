import {fail, message, warn} from 'danger'
import type {FilterParams} from './FilterParams'

type DangerMessageFunctions = {
  /**
   * Fails a build, outputting a specific reason for failing into a HTML table.
   */
  fail: typeof fail

  /**
   * Highlights low-priority issues, but does not fail the build. Message is shown inside a HTML table.
   */
  warn: typeof warn

  /**
   * Adds a message to the Danger table, the only difference between this and warn is the emoji which shows in the table.
   */
  message: typeof message
}

type Message = keyof DangerMessageFunctions

export type RuleParamsBase<M extends Message = 'fail'> = Pick<DangerMessageFunctions, M> & FilterParams
