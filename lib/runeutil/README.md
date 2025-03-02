# Rune

A lightweight, customizable text sanitization library for Unicode handling.

Rune provides elegant text sanitization with comprehensive Unicode support. Part of the Whimsy.

## Features

- **Comprehensive Unicode handling** - Process characters based on their Unicode properties
- **Advanced character categorization** - Special handling for emoji, zero-width, directional, and other special characters
- **Width-aware text processing** - Correctly handle full-width, wide, and ambiguous-width characters
- **VT control stripping** - Remove ANSI escape sequences from terminal output
- **Highly customizable** - Configure handling for different character types and replacements
- **Unicode normalization** - Support for NFC, NFD, NFKC, and NFKD normalization forms
- **TypeScript ready** - Full type definitions included

## Basic Usage

```typescript
import { sanitizeString } from '#'

// Sanitize text with basic options
const cleanText = sanitizeString('Hello\t\nWorld\u0000!')
// Result: &quot;Hello    World!&quot;

// Sanitize with custom options
const customClean = sanitizeString('Hello\t\nWorld\u0000!', {
  replaceNewLine: '<br>',
  replaceTab: '→',
  stripVTControlSequences: true
})
// Result: &quot;Hello→<br>World!&quot;
```

## API Reference

### Main Functions

```typescript
// Basic sanitization with default options
const clean = sanitizeString('Your\ttext\rhere')

// Sanitize with custom options
const customClean = sanitizeString('Your\ttext\rhere', {
  replaceTab: '  ',
  stripVTControlSequences: true
})

// Get the display width of a string
const width = getStringWidth('Hello 世界') // Returns 8

// Get the display width of a single character
const charWidth = getCharWidth('世') // Returns 2
```

### Sanitizer Options

| Option                     | Type                  | Default | Description                                    |
| -------------------------- | --------------------- | ------- | ---------------------------------------------- |
| `replaceNewLine`           | `string`              | `\n`    | String to replace newline characters with      |
| `replaceTab`               | `string`              | `...`   | String to replace tab characters with          |
| `customReplacements`       | `Map<number, string>` | `null`  | Map of codepoint to replacement string         |
| `preserveControlChars`     | `boolean`             | `false` | Whether to keep control characters             |
| `maxConsecutiveWhitespace` | `number`              | `0`     | Max consecutive whitespace (0 = unlimited)     |
| `stripVTControlSequences`  | `boolean`             | `false` | Whether to strip ANSI/VT control sequences     |
| `unicodeNormalization`     | `string`              | `null`  | Unicode normalization form (NFC/NFD/NFKC/NFKD) |
| `maxLength`                | `number`              | `0`     | Maximum result length (0 = unlimited)          |
| `replaceInvalidWith`       | `string`              | `null`  | String to replace invalid characters with      |
| `preserveZeroWidth`        | `boolean`             | `false` | Whether to keep zero-width characters          |
| `preserveDirectional`      | `boolean`             | `false` | Whether to keep directional mark characters    |
| `ansiWidth`                | `number`              | `0`     | Display width for ANSI escape sequences        |
| `controlWidth`             | `number`              | `0`     | Display width for control characters           |
| `tabWidth`                 | `number`              | `8`     | Display width for tab characters               |
| `ambiguousWidth`           | `number`              | `1`     | Display width for ambiguous-width characters   |
| `emojiWidth`               | `number`              | `2`     | Display width for emoji characters             |
| `fullWidthWidth`           | `number`              | `2`     | Display width for full-width characters        |
| `regularWidth`             | `number`              | `1`     | Display width for regular characters           |
| `wideWidth`                | `number`              | `2`     | Display width for wide characters (CJK, etc.)  |

### Utility Functions

```typescript
// Check character categories
isControlCharacter(codePoint) // Is this a control character?
isWhitespace(codePoint) // Is this a whitespace character?
isZeroWidth(codePoint) // Is this a zero-width character?
isDirectionalMark(codePoint) // Is this a directional mark?
isFormatting(codePoint) // Is this a formatting character?
isEmoji(codePoint) // Is this an emoji character?
isWideChar(codePoint) // Is this a wide character (like CJK)?
isFullWidth(codePoint) // Is this a full-width character?
isAmbiguousWidth(codePoint) // Is this an ambiguous-width character?

// Get character category
categorizeCharacter(codePoint, char) // Returns CharacterCategory enum value

// Strip VT control sequences
stripVTControlSequences(text) // Removes ANSI escape sequences
```

## Examples

### Basic Sanitization

```typescript
import { sanitizeString } from '#'

const result = sanitizeString('Hello\tWorld\r\nWith\u0000Control\u001BChars')
console.log(result)
// Output: &quot;Hello    World
// WithControl&quot;
```

### HTML-Safe Output

```typescript
import { sanitizeString } from '#'

const html = sanitizeString('Line 1\nLine 2\tIndented', {
  replaceNewLine: '<br>',
  replaceTab: '&nbsp;&nbsp;&nbsp;&nbsp;'
})
console.log(html)
// Output: &quot;Line 1<br>Line 2&nbsp;&nbsp;&nbsp;&nbsp;Indented&quot;
```

### Custom Character Replacements

```typescript
import { sanitizeString } from '#'

const customReplacements = new Map([
  [0x2022, '*'], // Replace bullet points with asterisks
  [0x00A9, '(c)'] // Replace copyright symbol
])

const result = sanitizeString('• Bullet point © 2023', { customReplacements })
console.log(result)
// Output: &quot;* Bullet point (c) 2023&quot;
```

### Unicode Normalization

```typescript
import { sanitizeString } from '#'

// Normalize composed and decomposed characters
const normalized = sanitizeString('café', { unicodeNormalization: 'NFC' })
console.log(normalized)
// Ensures consistent representation of accented characters
```

### Terminal Output Cleaning

```typescript
import { sanitizeString } from '#'

const coloredText = '\u001B[31mRed text\u001B[0m and \u001B[32mgreen text\u001B[0m'
const plain = sanitizeString(coloredText, { stripVTControlSequences: true })
console.log(plain)
// Output: &quot;Red text and green text&quot;
```

### Width-Aware Text Processing

```typescript
import { getStringWidth } from '#'

// Get display width of text with mixed character widths
const width = getStringWidth('Hello 世界!') // Returns 9
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
