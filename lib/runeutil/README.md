# Rune

A lightweight, customizable text sanitization

Rune provides elegant text sanitization for CLI apps. Part of the Whimsy.

## Features

- **Cool sanitization** - Handle control characters, invalid UTF-8, and special whitespace
- **Highly customizable** - Control newline and tab replacements, character mapping, and more
- **VT control stripping** - Remove ANSI escape sequences from terminal output
- **Lightweight** - Zero dependencies when used in Node.js environment
- **TypeScript ready** - Full type definitions included

## Basic Usage

```typescript
import { Rune } from '#'

// Create a sanitizer with default options
const sanitizer = new Rune()

// Sanitize text with control characters
const cleanText = sanitizer.sanitize('Hello\t\nWorld\u0000!')
// Result: &quot;Hello
// World!&quot;
```

## API Reference

### Creating a Sanitizer

```typescript
// Basic sanitizer with default options
const sanitizer = new Rune()

// Sanitizer with custom options
const sanitizer = new Rune({
  replaceNewLine: '<br>',
  replaceTab: '  ',
  stripVTControlSequences: true
})
```

### Sanitizer Options

| Option                     | Type                  | Default | Description                                |
| -------------------------- | --------------------- | ------- | ------------------------------------------ |
| `replaceNewLine`           | `string`              | `\n`    | String to replace newline characters with  |
| `replaceTab`               | `string`              | `...`   | String to replace tab characters with      |
| `customReplacements`       | `Map<number, string>` | `null`  | Map of codepoint to replacement string     |
| `preserveControlChars`     | `boolean`             | `false` | Whether to keep control characters         |
| `maxConsecutiveWhitespace` | `number`              | `0`     | Max consecutive whitespace (0 = unlimited) |
| `stripVTControlSequences`  | `boolean`             | `false` | Whether to strip ANSI/VT control sequences |

### Methods

```typescript
// Sanitize a string
const clean = sanitizer.sanitize('Your\ttext\rhere')

// Update configuration and get fluent interface
sanitizer.configure({
  replaceTab: '  ',
  stripVTControlSequences: true
}).sanitize('New\ttext')

// Get current configuration
const config = sanitizer.getOptions()
```

## Examples

### Basic Sanitization

```typescript
import { Rune } from '#'

const sanitizer = new Rune()
const result = sanitizer.sanitize('Hello\tWorld\r\nWith\u0000Control\u001BChars')
console.log(result)
// Output: &quot;Hello    World
// WithControl&quot;
```

### HTML-Safe Output

```typescript
import { Rune } from '#'

const htmlSanitizer = new Rune({
  replaceNewLine: '<br>',
  replaceTab: '&nbsp;&nbsp;&nbsp;&nbsp;'
})

const html = htmlSanitizer.sanitize('Line 1\nLine 2\tIndented')
console.log(html)
// Output: &quot;Line 1<br>Line 2&nbsp;&nbsp;&nbsp;&nbsp;Indented&quot;
```

### Custom Character Replacements

```typescript
import { Rune } from '#'

const customSanitizer = new Rune({
  customReplacements: new Map([
    [0x2022, '*'], // Replace bullet points with asterisks
    [0x00A9, '(c)'] // Replace copyright symbol
  ])
})

const result = customSanitizer.sanitize('• Bullet point © 2023')
console.log(result)
// Output: &quot;* Bullet point (c) 2023&quot;
```

### Terminal Output Cleaning

```typescript
import { Rune } from '#'

const terminalSanitizer = new Rune({
  stripVTControlSequences: true
})

const coloredText = '\u001B[31mRed text\u001B[0m and \u001B[32mgreen text\u001B[0m'
const plain = terminalSanitizer.sanitize(coloredText)
console.log(plain)
// Output: &quot;Red text and green text&quot;
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
