import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import {
  categorizeCharacter,
  CharacterCategory,
  isAmbiguousWidth,
  isControlCharacter,
  isDirectionalMark,
  isEmoji,
  isFormatting,
  isFullWidth,
  isWhitespace,
  isWideChar,
  isZeroWidth,
  sanitizeString,
} from './rune'

describe('character classification functions', async () => {
  it('isControlCharacter identifies control characters', () => {
    assert.equal(isControlCharacter(0x01), true)
    assert.equal(isControlCharacter(0x1F), true)
    assert.equal(isControlCharacter(0x7F), true)
    assert.equal(isControlCharacter(0x9F), true)
    assert.equal(isControlCharacter(0x20), false)
    assert.equal(isControlCharacter(0xA0), false)
  })

  it('isWhitespace identifies whitespace characters', () => {
    assert.equal(isWhitespace(0x0020), true) // Space
    assert.equal(isWhitespace(0x0009), true) // Tab
    assert.equal(isWhitespace(0x3000), true) // Ideographic space
    assert.equal(isWhitespace(0x0041), false) // 'A'
  })

  it('isZeroWidth identifies zero-width characters', () => {
    assert.equal(isZeroWidth(0x200B), true) // Zero-width space
    assert.equal(isZeroWidth(0x200D), true) // Zero-width joiner
    assert.equal(isZeroWidth(0x0020), false) // Space
  })

  it('isDirectionalMark identifies directional mark characters', () => {
    assert.equal(isDirectionalMark(0x200E), true) // LTR mark
    assert.equal(isDirectionalMark(0x200F), true) // RTL mark
    assert.equal(isDirectionalMark(0x0020), false) // Space
  })

  it('isFormatting identifies formatting characters', () => {
    assert.equal(isFormatting(0x2060), true) // Word joiner
    assert.equal(isFormatting(0x2063), true) // Invisible separator
    assert.equal(isFormatting(0x0020), false) // Space
  })

  it('isEmoji identifies emoji characters', () => {
    assert.equal(isEmoji(0x1F600), true) // Grinning face
    assert.equal(isEmoji(0x1F680), true) // Rocket
    assert.equal(isEmoji(0x0020), false) // Space
  })

  it('isWideChar identifies wide characters', () => {
    assert.equal(isWideChar(0x4E00), true) // CJK unified ideograph
    assert.equal(isWideChar(0x3042), true) // Hiragana
    assert.equal(isWideChar(0x0020), false) // Space
  })

  it('isFullWidth identifies full-width characters', () => {
    assert.equal(isFullWidth(0xFF01), true) // Full-width exclamation mark
    assert.equal(isFullWidth(0xFF21), true) // Full-width 'A'
    assert.equal(isFullWidth(0x0020), false) // Space
  })

  it('isAmbiguousWidth identifies ambiguous-width characters', () => {
    assert.equal(isAmbiguousWidth(0x00A1), true) // Inverted exclamation mark
    assert.equal(isAmbiguousWidth(0x00A4), true) // Currency sign
    assert.equal(isAmbiguousWidth(0x0020), false) // Space
  })
})

it('categorizeCharacter correctly categorizes characters', () => {
  assert.equal(categorizeCharacter(0xFFFD, '�'), CharacterCategory.INVALID)

  const newlineCodePoint = '\n'.codePointAt(0)
  const tabCodePoint = '\t'.codePointAt(0)

  if (newlineCodePoint !== undefined) {
    assert.equal(categorizeCharacter(newlineCodePoint, '\n'), CharacterCategory.NEWLINE)
  }

  if (tabCodePoint !== undefined) {
    assert.equal(categorizeCharacter(tabCodePoint, '\t'), CharacterCategory.TAB)
  }

  assert.equal(categorizeCharacter(0x01, '\u0001'), CharacterCategory.CONTROL)
  assert.equal(categorizeCharacter(0x200B, '\u200B'), CharacterCategory.ZERO_WIDTH)
  assert.equal(categorizeCharacter(0x200E, '\u200E'), CharacterCategory.DIRECTIONAL_MARK)
  assert.equal(categorizeCharacter(0x2060, '\u2060'), CharacterCategory.FORMATTING)
  assert.equal(categorizeCharacter(0x1F600, '😀'), CharacterCategory.EMOJI)
  assert.equal(categorizeCharacter(0x4E00, '一'), CharacterCategory.WIDE_CHAR)
  assert.equal(categorizeCharacter(0x00A1, '¡'), CharacterCategory.AMBIGUOUS_WIDTH)
  assert.equal(categorizeCharacter(0x0020, ' '), CharacterCategory.WHITESPACE)
  assert.equal(categorizeCharacter(0x0041, 'A'), CharacterCategory.PRINTABLE)
})

describe('sanitizeString with various options', async () => {
  it('basic sanitization', () => {
    const input = 'Hello\tWorld\n\n'
    const expected = 'Hello    World\n\n'
    assert.equal(sanitizeString(input), expected)
  })

  it('with maxConsecutiveWhitespace', () => {
    const input = 'Hello    World'
    const expected = 'Hello  World'
    assert.equal(sanitizeString(input, { maxConsecutiveWhitespace: 2 }), expected)
  })

  it('with replaceNewLine', () => {
    const input = 'Hello\nWorld'
    const expected = 'Hello<br>World'
    assert.equal(sanitizeString(input, { replaceNewLine: '<br>' }), expected)
  })

  it('with replaceTab', () => {
    const input = 'Hello\tWorld'
    const expected = 'Hello→World'
    assert.equal(sanitizeString(input, { replaceTab: '→' }), expected)
  })

  it('with stripVTControlSequences', () => {
    const input = '\u001B[31mHello\u001B[0m'
    const expected = 'Hello'
    assert.equal(sanitizeString(input, { stripVTControlSequences: true }), expected)
  })

  it('with maxLength', () => {
    const input = 'Hello World'
    const expected = 'Hello'
    assert.equal(sanitizeString(input, { maxLength: 5 }), expected)
  })

  it('with customReplacements', () => {
    const input = 'Hello!'
    const customReplacements = new Map([[33, '?']]) // Replace '!' with '?'
    const expected = 'Hello?'
    assert.equal(sanitizeString(input, { customReplacements }), expected)
  })

  it('with preserveZeroWidth option', () => {
    const input = 'Hello\u200BWorld' // Zero-width space
    const expectedPreserved = 'Hello\u200BWorld'
    const expectedRemoved = 'HelloWorld'

    assert.equal(sanitizeString(input, { preserveZeroWidth: true }), expectedPreserved)
    assert.equal(sanitizeString(input, { preserveZeroWidth: false }), expectedRemoved)
  })

  it('with preserveDirectional option', () => {
    const input = 'Hello\u200EWorld' // LTR mark
    const expectedPreserved = 'Hello\u200EWorld'
    const expectedRemoved = 'HelloWorld'

    assert.equal(sanitizeString(input, { preserveDirectional: true }), expectedPreserved)
    assert.equal(sanitizeString(input, { preserveDirectional: false }), expectedRemoved)
  })

  it('with preserveControlChars option', () => {
    const input = 'Hello\u0007World' // Bell character
    const expectedPreserved = 'Hello\u0007World'
    const expectedRemoved = 'HelloWorld'

    assert.equal(sanitizeString(input, { preserveControlChars: true }), expectedPreserved)
    assert.equal(sanitizeString(input, { preserveControlChars: false }), expectedRemoved)
  })

  it('with replaceInvalidWith option', () => {
    const input = 'Hello\uFFFDWorld' // Replacement character
    const expected = 'Hello?World'

    assert.equal(sanitizeString(input, { replaceInvalidWith: '?' }), expected)
  })
})
