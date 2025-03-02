import process from 'node:process'
// eslint-disable-next-line import/no-named-default
import { default as sw } from 'fast-string-width'
import { AMBIGUOUS_WIDTH_RANGES, DIRECTIONAL_CODE_POINTS, EMOJI_RANGES, FORMATTING_CODE_POINTS, FULL_WIDTH_RANGES, WHITESPACE_CODE_POINTS, WIDE_CHAR_RANGES, ZERO_WIDTH_CODE_POINTS } from './constants'

export interface SanitizerOptions {
  replaceNewLine?: string
  replaceTab?: string
  customReplacements?: Map<number, string>
  preserveControlChars?: boolean
  maxConsecutiveWhitespace?: number
  stripVTControlSequences?: boolean
  unicodeNormalization?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'
  maxLength?: number
  replaceInvalidWith?: string
  preserveZeroWidth?: boolean
  preserveDirectional?: boolean
  ansiWidth?: number
  controlWidth?: number
  tabWidth?: number
  ambiguousWidth?: number
  emojiWidth?: number
  fullWidthWidth?: number
  regularWidth?: number
  wideWidth?: number
}

export enum CharacterCategory {
  CONTROL,
  WHITESPACE,
  NEWLINE,
  TAB,
  PRINTABLE,
  INVALID,
  ZERO_WIDTH,
  FORMATTING,
  DIRECTIONAL_MARK,
  EMOJI,
  WIDE_CHAR,
  FULL_WIDTH,
  AMBIGUOUS_WIDTH,
}

// Utility functions
export function isControlCharacter(codePoint: number): boolean {
  return (codePoint <= 0x1F) || (codePoint >= 0x7F && codePoint <= 0x9F)
}

export function isWhitespace(codePoint: number): boolean {
  return WHITESPACE_CODE_POINTS.has(codePoint)
}

export function isZeroWidth(codePoint: number): boolean {
  return ZERO_WIDTH_CODE_POINTS.has(codePoint)
}

export function isDirectionalMark(codePoint: number): boolean {
  return DIRECTIONAL_CODE_POINTS.has(codePoint)
}

export function isFormatting(codePoint: number): boolean {
  return FORMATTING_CODE_POINTS.has(codePoint)
}

export function isEmoji(codePoint: number): boolean {
  return EMOJI_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end)
}

export function isWideChar(codePoint: number): boolean {
  return WIDE_CHAR_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end)
}

export function isFullWidth(codePoint: number): boolean {
  return FULL_WIDTH_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end)
}

export function isAmbiguousWidth(codePoint: number): boolean {
  return AMBIGUOUS_WIDTH_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end)
}

export function categorizeCharacter(codePoint: number, char: string): CharacterCategory {
  if (codePoint === 0xFFFD) {
    return CharacterCategory.INVALID
  }

  if (char === '\r' || char === '\n') {
    return CharacterCategory.NEWLINE
  }

  if (char === '\t') {
    return CharacterCategory.TAB
  }

  if (isControlCharacter(codePoint)) {
    return CharacterCategory.CONTROL
  }

  if (isZeroWidth(codePoint)) {
    return CharacterCategory.ZERO_WIDTH
  }

  if (isDirectionalMark(codePoint)) {
    return CharacterCategory.DIRECTIONAL_MARK
  }

  if (isFormatting(codePoint)) {
    return CharacterCategory.FORMATTING
  }

  if (isEmoji(codePoint)) {
    return CharacterCategory.EMOJI
  }

  if (isWideChar(codePoint)) {
    return CharacterCategory.WIDE_CHAR
  }

  if (isFullWidth(codePoint)) {
    return CharacterCategory.FULL_WIDTH
  }

  if (isAmbiguousWidth(codePoint)) {
    return CharacterCategory.AMBIGUOUS_WIDTH
  }

  if (isWhitespace(codePoint)) {
    return CharacterCategory.WHITESPACE
  }

  return CharacterCategory.PRINTABLE
}

export function stripVTControlSequences(input: string): string {
  const util = typeof process !== 'undefined' ? globalThis.require?.('util') : null

  if (util?.stripVTControlCharacters) {
    return util.stripVTControlCharacters(input)
  }

  // eslint-disable-next-line no-control-regex, regexp/no-obscure-range
  return input.replace(/\u001B(?:[@-Z\\-_]|\[[0-9?]*[ -/]*[@-~])/g, '')
}

export function handleWhitespaceLimit(
  result: string[],
  char: string,
  count: number,
  maxConsecutiveWhitespace: number = 0,
): void {
  if (maxConsecutiveWhitespace === 0 || count < maxConsecutiveWhitespace) {
    result.push(char)
  }
}

export function processCharacter(
  char: string,
  codePoint: number,
  result: string[],
  consecutiveWhitespace: number,
  options: SanitizerOptions,
): number {
  if (options.customReplacements?.has(codePoint)) {
    const replacement = options.customReplacements.get(codePoint)
    if (replacement !== undefined) {
      result.push(replacement)
      return isWhitespace(codePoint) ? consecutiveWhitespace + 1 : 0
    }
  }

  const category = categorizeCharacter(codePoint, char)

  switch (category) {
    case CharacterCategory.INVALID:
      if (options.replaceInvalidWith) {
        result.push(options.replaceInvalidWith)
      }
      return consecutiveWhitespace

    case CharacterCategory.NEWLINE:
      handleWhitespaceLimit(
        result,
        options.replaceNewLine ?? '\n',
        consecutiveWhitespace,
        options.maxConsecutiveWhitespace,
      )
      return 1

    case CharacterCategory.TAB:
      handleWhitespaceLimit(
        result,
        options.replaceTab ?? '    ',
        consecutiveWhitespace,
        options.maxConsecutiveWhitespace,
      )
      return 1

    case CharacterCategory.CONTROL:
      if (options.preserveControlChars) {
        result.push(char)
        return 0
      }
      return consecutiveWhitespace

    case CharacterCategory.WHITESPACE:
      handleWhitespaceLimit(
        result,
        char,
        consecutiveWhitespace,
        options.maxConsecutiveWhitespace,
      )
      return consecutiveWhitespace + 1

    case CharacterCategory.ZERO_WIDTH:
      if (options.preserveZeroWidth) {
        result.push(char)
      }
      return consecutiveWhitespace

    case CharacterCategory.DIRECTIONAL_MARK:
      if (options.preserveDirectional) {
        result.push(char)
      }
      return consecutiveWhitespace

    case CharacterCategory.FORMATTING:
    case CharacterCategory.EMOJI:
    case CharacterCategory.WIDE_CHAR:
    case CharacterCategory.FULL_WIDTH:
    case CharacterCategory.AMBIGUOUS_WIDTH:
    case CharacterCategory.PRINTABLE:
    default:
      result.push(char)
      return 0
  }
}

export function processCharacters(input: string, options: SanitizerOptions): string {
  const codePoints = Array.from(input)
  const result: string[] = []
  let consecutiveWhitespace = 0
  for (const char of codePoints) {
    const codePoint = char.codePointAt(0)
    if (codePoint === undefined)
      continue

    consecutiveWhitespace = processCharacter(
      char,
      codePoint,
      result,
      consecutiveWhitespace,
      options,
    )
  }

  return result.join('')
}

export function sanitizeString(input: string, options: SanitizerOptions = {}): string {
  if (!input)
    return ''

  let processedInput = input

  if (options.stripVTControlSequences) {
    processedInput = stripVTControlSequences(processedInput)
  }

  if (options.unicodeNormalization && typeof processedInput.normalize === 'function') {
    processedInput = processedInput.normalize(options.unicodeNormalization)
  }

  let result = processCharacters(processedInput, options)

  const maxLength = options.maxLength
  if (maxLength !== undefined && maxLength > 0 && result.length > maxLength) {
    result = result.slice(0, maxLength)
  }

  return result
}

export function getCharWidth(char: string, options: SanitizerOptions = {}): number {
  const codePoint = char.codePointAt(0)
  if (codePoint === undefined)
    return 0

  if (isEmoji(codePoint))
    return options.emojiWidth ?? 2
  if (isFullWidth(codePoint))
    return options.fullWidthWidth ?? 2
  if (isWideChar(codePoint))
    return options.wideWidth ?? 2
  if (isAmbiguousWidth(codePoint))
    return options.ambiguousWidth ?? 1
  if (isZeroWidth(codePoint))
    return 0
  if (isControlCharacter(codePoint))
    return 0

  return 1
}

export function convertToFastStringWidthOptions(options: SanitizerOptions) {
  return {
    ansiWidth: options.ansiWidth ?? 0,
    controlWidth: options.controlWidth ?? 0,
    tabWidth: options.tabWidth ?? 8,
    ambiguousWidth: options.ambiguousWidth ?? 1,
    emojiWidth: options.emojiWidth ?? 2,
    fullWidthWidth: options.fullWidthWidth ?? 2,
    regularWidth: options.regularWidth ?? 1,
    wideWidth: options.wideWidth ?? 2,
  }
}

export function getStringWidth(str: string, options: SanitizerOptions = {}): number {
  const sanitizedStr = options.stripVTControlSequences || options.maxConsecutiveWhitespace
    ? sanitizeString(str, options)
    : str

  return sw(sanitizedStr, convertToFastStringWidthOptions(options))
}
