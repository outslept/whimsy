import process from 'node:process'

export interface SanitizerOptions {
  replaceNewLine?: string
  replaceTab?: string
  customReplacements?: Map<number, string>
  preserveControlChars?: boolean
  maxConsecutiveWhitespace?: number
  stripVTControlSequences?: boolean
}

export interface Sanitizer {
  sanitize: (input: string) => string
  configure: (newOptions: Partial<SanitizerOptions>) => Sanitizer
  getOptions: () => SanitizerOptions
}

enum CharacterCategory {
  CONTROL,
  WHITESPACE,
  NEWLINE,
  TAB,
  PRINTABLE,
  INVALID,
}

class Rune implements Sanitizer {
  private options: SanitizerOptions
  private readonly util: any

  constructor(opts: SanitizerOptions = {}) {
    this.options = {
      replaceNewLine: opts.replaceNewLine ?? '\n',
      replaceTab: opts.replaceTab ?? '    ',
      customReplacements: opts.customReplacements ?? new Map<number, string>(),
      preserveControlChars: opts.preserveControlChars ?? false,
      maxConsecutiveWhitespace: opts.maxConsecutiveWhitespace ?? 0,
      stripVTControlSequences: opts.stripVTControlSequences ?? false,
    }

    this.util = typeof process !== 'undefined'
      ? globalThis.require?.('util')
      : null
  }

  configure(newOptions: Partial<SanitizerOptions>): Sanitizer {
    this.options = { ...this.options, ...newOptions }
    return this
  }

  getOptions(): SanitizerOptions {
    return { ...this.options }
  }

  sanitize(input: string): string {
    if (!input)
      return ''

    const processedInput = this.applyVTControlStripping(input)
    return this.processCharacters(processedInput)
  }

  private applyVTControlStripping(input: string): string {
    if (this.options.stripVTControlSequences && this.util?.stripVTControlCharacters) {
      return this.util.stripVTControlCharacters(input)
    }
    return input
  }

  private processCharacters(input: string): string {
    const codePoints = Array.from(input)
    const result: string[] = []
    let consecutiveWhitespace = 0

    for (const char of codePoints) {
      const codePoint = char.codePointAt(0)
      if (codePoint === undefined)
        continue

      consecutiveWhitespace = this.processCharacter(
        char,
        codePoint,
        result,
        consecutiveWhitespace,
      )
    }

    return result.join('')
  }

  private processCharacter(
    char: string,
    codePoint: number,
    result: string[],
    consecutiveWhitespace: number,
  ): number {
    if (this.options.customReplacements?.has(codePoint)) {
      const replacement = this.options.customReplacements.get(codePoint)
      if (replacement !== undefined) {
        result.push(replacement)
        return this.isWhitespace(codePoint) ? consecutiveWhitespace + 1 : 0
      }
    }

    return this.processCharacterByCategory(
      char,
      codePoint,
      result,
      consecutiveWhitespace,
    )
  }

  private processCharacterByCategory(
    char: string,
    codePoint: number,
    result: string[],
    consecutiveWhitespace: number,
  ): number {
    const category = this.categorizeCharacter(codePoint, char)

    switch (category) {
      case CharacterCategory.INVALID:
        return consecutiveWhitespace

      case CharacterCategory.NEWLINE:
        this.handleWhitespaceLimit(result, this.options.replaceNewLine ?? '\n', consecutiveWhitespace)
        return 1

      case CharacterCategory.TAB:
        this.handleWhitespaceLimit(result, this.options.replaceTab ?? '    ', consecutiveWhitespace)
        return 1

      case CharacterCategory.CONTROL:
        if (this.options.preserveControlChars) {
          result.push(char)
          return 0
        }
        return consecutiveWhitespace

      case CharacterCategory.WHITESPACE:
        this.handleWhitespaceLimit(result, char, consecutiveWhitespace)
        return consecutiveWhitespace + 1

      case CharacterCategory.PRINTABLE:
      default:
        result.push(char)
        return 0
    }
  }

  private categorizeCharacter(codePoint: number, char: string): CharacterCategory {
    if (codePoint === 0xFFFD) {
      return CharacterCategory.INVALID
    }

    if (char === '\r' || char === '\n') {
      return CharacterCategory.NEWLINE
    }

    if (char === '\t') {
      return CharacterCategory.TAB
    }

    if (this.isControlCharacter(codePoint)) {
      return CharacterCategory.CONTROL
    }

    if (this.isWhitespace(codePoint)) {
      return CharacterCategory.WHITESPACE
    }

    return CharacterCategory.PRINTABLE
  }

  private handleWhitespaceLimit(result: string[], char: string, count: number): void {
    const maxConsecutiveWhitespace = this.options.maxConsecutiveWhitespace ?? 0
    if (maxConsecutiveWhitespace === 0 || count < maxConsecutiveWhitespace) {
      result.push(char)
    }
  }

  private isControlCharacter(codePoint: number): boolean {
    return (codePoint <= 0x1F) || (codePoint >= 0x7F && codePoint <= 0x9F)
  }

  private isWhitespace(codePoint: number): boolean {
    return [0x20, 0x09, 0x0A, 0x0D, 0x0B, 0x0C, 0xA0, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x200B, 0x2028, 0x2029, 0x202F, 0x205F, 0x3000].includes(codePoint)
  }
}

export { Rune }
