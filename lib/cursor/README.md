# Cursor

A flexible, terminal cursor component for CLI applications.

## Features

- **Customizable Blinking:** Control blink speed, character, and styles.
- **Multiple Modes:** Supports `'blink'`, `'static'`, and `'hide'` modes.
- **Rich Styling:** Leverages `ansis` for full terminal color and style support.
- **Focus-Aware:** Manages blinking state based on focus.
- **Callback for Updates:** Provides an `onUpdate` hook for redraws during blinking.
- **TypeScript Ready:** Fully typed for robust development.

## API Reference

### Cursor Modes

A string union defining the cursor's behavior:

```ts
type CursorMode = 'blink' | 'static' | 'hide';
```

- `'blink'`: Cursor blinks when focused.
- `'static'`: Cursor remains visible (using `style`) but doesn't blink.
- `'hide'`: Cursor is not rendered.

## Creating a Cursor

```ts
import c from 'ansis';
import { Cursor } from './cursor';

// Basic cursor with default options
const cursor1 = new Cursor();

const cursor2 = new Cursor({
  blinkSpeed: 600,          // Blink interval in ms
  char: '▋',                // Cursor character
  style: c.cyan.inverse,    // Style when "on" or static
  textStyle: c.cyan.dim,    // Style when "off" during blink
  mode: 'blink',            // Initial mode
  onUpdate: () => { /* Redraw UI */ } // Callback for blink updates
});
```

### Cursor Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `blinkSpeed` | `number` | `530` | Blink interval in milliseconds. |
| `char` | `string` | `' '` | Character to display. Takes the first char. |
| `style` | `Ansis` | `c.reset.inverse` | Style for the cursor when "on" or static. |
| `textStyle` | `Ansis` | `c.reset` | Style for the cursor when "off" during blink. |
| `mode` | `CursorMode` | `'blink'` | Initial cursor behavior mode. |
| `onUpdate` | `() => void` | `undefined` | Callback invoked when blink state changes view. |

## Methods

```ts
// Set the cursor's behavior mode ('blink', 'static', 'hide')
cursor.setMode('static');

// Inform the cursor whether it has focus (activates/deactivates blinking)
cursor.setFocus(true);

// Check if the cursor currently has focus
const focused: boolean = cursor.isFocused();

// Set the main style (when "on" or static) using an ansis instance
cursor.setStyle(c.red.bold.inverse);

// Set the secondary style (when "off" during blink)
cursor.setTextStyle(c.red.dim);

// Change the character displayed by the cursor
cursor.setChar('|');

// Adjust the blink rate in milliseconds
cursor.setBlinkSpeed(400);

// Get the current configuration options
const options = cursor.getOptions();

// Get the ANSI string for the cursor's current visual state
const displayString: string = cursor.view();

// Reset the internal blink state and stop timers
cursor.reset();

// Get the current mode
const mode: CursorMode = cursor.getMode();
```
