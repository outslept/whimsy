# Wink

A flexible, terminal cursor component for CLI apps. Part of Whimsy.

## Features

- **Customizable blinking cursor** - Control speed, appearance, and behavior
- **Multiple cursor modes** - Support for blinking, static, and hidden cursor states
- **Terminal styling** - Rich styling options for cursor appearance
- **Focus-aware** - Automatically handles focus and blur events
- **High performance** - Optimized for smooth rendering in terminal applications
- **TypeScript ready** - Full type definitions included

## Basic Usage

```typescript
import { CursorMode, TerminalStyle, Wink } from '#'

// Create a cursor with default options
const cursor = new Wink()

// Focus the cursor and start blinking
const [_, command] = cursor.update({ type: 'focus' })

// Render the cursor in your terminal app
process.stdout.write(cursor.view());

// Handle blink updates
(async () => {
  while (true) {
    if (command) {
      const msg = await command();
      [_, command] = cursor.update(msg)
      // Re-render cursor when it blinks
      process.stdout.write(`\b${cursor.view()}`)
    }
    else {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
})()
```

## API Reference

### Cursor Modes

```typescript
enum CursorMode {
  Blink = 0, // Cursor blinks when focused
  Static = 1, // Cursor remains visible but doesn't blink
  Hide = 2 // Cursor is hidden
}
```

### Creating a Cursor

```typescript
// Basic cursor with default options
const cursor = new Wink()

// Cursor with custom options
const cursor = new Wink({
  blinkSpeed: 600,
  char: '█',
  style: TerminalStyle.create().color(33),
  textStyle: TerminalStyle.create(),
  mode: CursorMode.Blink
})
```

### Cursor Options

| Option       | Type            | Default               | Description                           |
| ------------ | --------------- | --------------------- | ------------------------------------- |
| `blinkSpeed` | `number`        | `530`                 | Blink interval in milliseconds        |
| `char`       | `string`        | `' '`                 | Character to display as cursor        |
| `style`      | `TerminalStyle` | `new TerminalStyle()` | Style for cursor when highlighted     |
| `textStyle`  | `TerminalStyle` | `new TerminalStyle()` | Style for cursor when not highlighted |
| `mode`       | `CursorMode`    | `CursorMode.Blink`    | Cursor behavior mode                  |

### Terminal Styling

```typescript
// Create a style
const style = TerminalStyle.create()
  .color(33) // Set foreground color (ANSI color code)
  .bgColor(44) // Set background color
  .bold(true) // Make text bold
  .reverse(true) // Reverse colors
  .inline(true) // Don't reset style after rendering

// Apply style to text
const styledText = style.render('Hello')
```

### Update Messages

```typescript
// Message types for cursor updates
type WinkMsg =
  | { type: 'initialBlink' }
  | { type: 'blink', id: number, tag: number }
  | { type: 'blinkCanceled' }
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'updateOptions', options: Partial<CursorOptions> }
```

### Methods

```typescript
// Update cursor state based on a message
const [updatedCursor, command] = cursor.update({ type: 'focus' })

// Get cursor display string
const cursorDisplay = cursor.view()

// Set cursor mode
cursor.setMode(CursorMode.Static)

// Get current options
const options = cursor.getOptions()

// Reset cursor state
cursor.reset()

// Check if cursor is focused
const isFocused = cursor.isFocused()

// Get current mode
const mode = cursor.getMode()
```

## Examples

### Simple Text Editor

```typescript
import { CursorMode, TerminalStyle, Wink } from '#'

async function simpleEditor() {
  // Create cursor
  const cursor = new Wink({
    char: '█',
    style: TerminalStyle.create().color(46)
  })

  let text = ''
  let position = 0
  let [_, command] = cursor.update({ type: 'focus' })

  // Render function
  function render() {
    process.stdout.write('\x1B[2J\x1B[0;0H') // Clear screen
    const display = text.slice(0, position)
      + cursor.view()
      + text.slice(position)
    process.stdout.write(`Editor: ${display}\n`)
  }

  // Handle keyboard input
  process.stdin.setRawMode(true)
  process.stdin.on('data', (key) => {
    if (key === '\u0003')
      process.exit() // Ctrl+C
    if (key === '\u007F') { // Backspace
      if (position > 0) {
        text = text.slice(0, position - 1) + text.slice(position)
        position--
      }
    }
    else if (key.length === 1) {
      text = text.slice(0, position) + key + text.slice(position)
      position++
    }
    render()
  })

  // Cursor update loop
  render()
  while (true) {
    if (command) {
      const msg = await command();
      [_, command] = cursor.update(msg)
      render()
    }
    else {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

simpleEditor()
```

### Customizing Cursor Appearance

```typescript
import { CursorMode, TerminalStyle, Wink } from '#'

// Create a custom block cursor
const blockCursor = new Wink({
  char: '█',
  style: TerminalStyle.create().color(196), // Bright red
  blinkSpeed: 400 // Faster blinking
})

// Create an underscore cursor
const underscoreCursor = new Wink({
  char: '_',
  style: TerminalStyle.create().color(51), // Cyan
  blinkSpeed: 700 // Slower blinking
})

// Create a static cursor (non-blinking)
const staticCursor = new Wink({
  char: '|',
  style: TerminalStyle.create().bold(true).color(226), // Bold yellow
  mode: CursorMode.Static
})
```

### Changing Cursor Properties

```typescript
import { CursorMode, Wink } from '#'

const cursor = new Wink()

// Update multiple options at once
cursor.update({
  type: 'updateOptions',
  options: {
    blinkSpeed: 800,
    char: '▌',
    mode: CursorMode.Blink
  }
})

// Change just the cursor mode
cursor.setMode(CursorMode.Static)

// Later, hide the cursor
cursor.setMode(CursorMode.Hide)
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
