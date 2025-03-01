# Whirl

A lightweight, customizable terminal spinner library for Node.js.

Whirl provides elegant loading spinners for your command-line interfaces. Part of the Whimsy.

## Features

- **Elegant animations** - Multiple spinner styles including dots, lines, pulses, and whimsical themes
- **Highly customizable** - Control colors, text, indentation, and animation speed
- **Promise integration** - Easily wrap async operations with animated spinners
- **Lightweight** - Zero dependencies beyond picocolors for terminal coloring
- **TypeScript ready** - Full type definitions included

## Basic Usage

```typescript
import { Whirl } from '#'

// Create and start a spinner
const spinner = new Whirl('Loading...').start()

// Later, stop the spinner and show success
setTimeout(() => {
  spinner.succeed('Data loaded successfully!')
}, 2000)
```

## API Reference

### Creating a Spinner

```typescript
// Basic spinner with default options
const spinner = new Whirl('Loading...')

// Spinner with custom options
const spinner = new Whirl({
  text: 'Processing data...',
  spinner: 'dots2',
  color: 'blue',
  indent: 2
})
```

### Spinner Options

| Option         | Type                       | Default          | Description                                |
| -------------- | -------------------------- | ---------------- | ------------------------------------------ |
| `text`         | `string`                   | `''`             | Text displayed after the spinner           |
| `prefixText`   | `string \| (() => string)` | `''`             | Text displayed before the spinner          |
| `suffixText`   | `string \| (() => string)` | `''`             | Text displayed after the main text         |
| `spinner`      | `string \| SpinnerStyle`   | `'dots'`         | Spinner style to use                       |
| `color`        | `string \| boolean`        | `'cyan'`         | Color for the spinner                      |
| `hideCursor`   | `boolean`                  | `true`           | Whether to hide the cursor during spinning |
| `indent`       | `number`                   | `0`              | Number of spaces to indent the spinner     |
| `interval`     | `number`                   | Style-dependent  | Time in ms between spinner frames          |
| `stream`       | `WriteStream`              | `process.stderr` | Stream to write spinner output to          |
| `isEnabled`    | `boolean`                  | Auto-detected    | Whether the spinner is enabled             |
| `isSilent`     | `boolean`                  | `false`          | Whether to suppress all output             |
| `discardStdin` | `boolean`                  | `true`           | Whether to discard stdin input             |

### Available Spinner Styles

- `dots`: ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏
- `line`: |/-\
- `dots2`: ⣾⣽⣻⢿⡿⣟⣯⣷
- `pulse`: █▓▒░▒▓
- `points`: ∙∙∙ ●∙∙ ∙●∙ ∙∙●
- `whimsy`: ✧✦✧✦✧✦
- `magic`: ⊹ ⊹✧ ⊹✧˚ ⊹✧˚⋆ ✧˚⋆ ˚⋆ ⋆
- `fairy`: ∗ ∗⋆ ∗⋆✩ ⋆✩ ✩ ✩∗ ✩∗⋆ ∗⋆

### Methods

#### Control Methods

```typescript
// Start the spinner
spinner.start('Optional new text')

// Stop the spinner and clear output
spinner.stop()

// Clear the spinner without stopping
spinner.clear()

// Stop with success symbol (green ✔)
spinner.succeed('Operation completed')

// Stop with error symbol (red ✖)
spinner.fail('Operation failed')

// Stop with warning symbol (yellow ⚠)
spinner.warn('Operation completed with warnings')

// Stop with info symbol (blue ℹ)
spinner.info('Operation completed with info')

// Stop with custom symbol and styling
spinner.stopAndPersist({
  symbol: '🚀',
  text: 'Launched successfully',
  color: 'magenta'
})
```

#### Property Getters/Setters

The following properties can be accessed and modified during execution:

- `text` - Main spinner text
- `prefixText` - Text displayed before the spinner
- `suffixText` - Text displayed after the main text
- `color` - Spinner color
- `spinner` - Spinner animation style
- `indent` - Indentation level
- `interval` - Animation speed
- `isSpinning` - Read-only status

```typescript
// Change text while spinning
spinner.text = 'New status message'

// Change spinner style while running
spinner.spinner = 'magic'
```

### Promise Integration

The `whirlPromise` function automatically manages a spinner for async operations:

```typescript
import { whirlPromise } from 'whirl'

// Basic usage
const result = await whirlPromise(
  fetchData(),
  'Loading data...'
)

// Advanced usage with spinner updates
const result = await whirlPromise(
  async (spinner) => {
    spinner.text = 'Step 1: Fetching'
    const data = await fetchData()

    spinner.text = 'Step 2: Processing'
    return processData(data)
  },
  {
    text: 'Working...',
    spinner: 'whimsy',
    successText: result => `Processed ${result.length} items`,
    failText: error => `Failed: ${error.message}`
  }
)
```

## Examples

### Basic Spinner

```typescript
import { Whirl } from 'whirl'

const spinner = new Whirl('Loading unicorns').start()

setTimeout(() => {
  spinner.succeed('Unicorns loaded')
}, 2000)
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
