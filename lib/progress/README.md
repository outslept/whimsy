# Progress

A customizable, feature-rich progress bar library for terminal applications.

Progress provides elegant terminal progress indicators with comprehensive styling and formatting options. Part of the Whimsy.

## Features

- **Multiple progress bar styles** - Block, smooth, gradient, braille, and spinner
- **Color support** - Colorize different parts of the progress bar
- **Time estimation** - Show elapsed time and ETA
- **Customizable templates** - Define your own display format
- **Animation support** - Animated spinners and progress indicators
- **Right-to-left support** - For RTL languages and interfaces
- **TypeScript ready** - Full type definitions included
- **Preset themes** - Ready-to-use progress bar styles

## Basic Usage

```typescript
import { Progress } from '#'

// Create a basic progress bar
const bar = new Progress()

// Set the total value
bar.setTotal(100)

// Update progress
bar.update(25)
console.log(bar.toString())
// Output: [#####---------------] 25%

// Complete the progress
bar.complete()
console.log(bar.toString())
// Output: [####################] 100%
```

## API Reference

### Main Functions

```typescript
// Create a progress bar with default options
const bar = new Progress()

// Create with custom options
const customBar = new Progress({
  width: 30,
  complete: '█',
  incomplete: '░',
  template: '[{bar}] {percent}',
  completeColor: 'green'
})

// Set the total value
bar.setTotal(100)

// Update the progress value
bar.update(25)

// Increment the progress
bar.increment(5)

// Set progress as percentage
bar.percent(50)

// Complete the progress
bar.complete()

// Reset the progress
bar.reset()

// Apply a preset theme
bar.theme('unicode')

// Configure options
bar.configure({ showEta: true })

// Get the current state
const state = bar.getState()
```

### Progress Options

| Option            | Type       | Default             | Description                                    |
| ----------------- | ---------- | ------------------- | ---------------------------------------------- |
| `width`           | `number`   | `20`                | Width of the progress bar                      |
| `complete`        | `string`   | `#`                 | Character for completed portion                |
| `incomplete`      | `string`   | `-`                 | Character for incomplete portion               |
| `head`            | `string`   | `''`                | Character for the head of the progress bar     |
| `template`        | `string`   | `[{bar}] {percent}` | Display template                               |
| `clearOnUpdate`   | `boolean`  | `true`              | Clear line before updating                     |
| `style`           | `string`   | `block`             | Bar style (block/smooth/gradient/braille/text) |
| `rtl`             | `boolean`  | `false`             | Right-to-left display                          |
| `completeColor`   | `string`   | `reset`             | Color for completed portion                    |
| `incompleteColor` | `string`   | `reset`             | Color for incomplete portion                   |
| `percentColor`    | `string`   | `reset`             | Color for percentage text                      |
| `percentFormat`   | `string`   | `percent`           | Format (percent/ratio/fraction/none)           |
| `decimals`        | `number`   | `0`                 | Decimal places for percentage                  |
| `showElapsed`     | `boolean`  | `false`             | Show elapsed time                              |
| `showEta`         | `boolean`  | `false`             | Show estimated time of arrival                 |
| `timeFormat`      | `string`   | `compact`           | Time format (seconds/compact/hms)              |
| `animate`         | `boolean`  | `false`             | Enable animation                               |
| `animationFrames` | `string[]` | `['⠋',...]`         | Animation frames                               |
| `partialBlocks`   | `string[]` | See default         | Characters for partial blocks                  |

### Preset Themes

```typescript
// Available preset themes:
// - classic: Traditional ASCII progress bar
// - unicode: Modern Unicode block characters
// - smooth: Smooth partial block rendering
// - gradient: Colored gradient effect
// - minimal: Text-only percentage display
// - detailed: Shows elapsed time and ETA
// - braille: Uses Braille patterns
// - spinner: Animated spinner indicator

// Apply a theme
const bar = new Progress().theme('unicode')
```

### Template Variables

The following variables can be used in custom templates:

| Variable    | Description                      |
| ----------- | -------------------------------- |
| `{bar}`     | The progress bar itself          |
| `{percent}` | Percentage completion            |
| `{ratio}`   | Ratio as &quot;value/total&quot; |
| `{value}`   | Current progress value           |
| `{total}`   | Total progress value             |
| `{elapsed}` | Elapsed time                     |
| `{eta}`     | Estimated time remaining         |

## Examples

### Basic Progress Bar

```typescript
import { Progress } from '#'

const bar = new Progress()
bar.setTotal(100)

// Update progress
for (let i = 0; i <= 100; i += 10) {
  bar.update(i)
  console.log(bar.toString())
}
```

### Styled Progress Bar

```typescript
import { Progress } from '#'

const bar = new Progress({
  width: 30,
  complete: '█',
  incomplete: '░',
  template: '{bar} {percent}',
  completeColor: 'green',
  percentColor: 'cyan'
})

bar.setTotal(100)
bar.update(50)
console.log(bar.toString())
// Output: ███████████████░░░░░░░░░░░░░ 50%
```

### Progress with Time Information

```typescript
import { Progress } from '#'

const bar = new Progress({
  width: 20,
  complete: '=',
  incomplete: ' ',
  head: '>',
  template: '[{bar}] {percent} | {elapsed}<{eta}',
  showElapsed: true,
  showEta: true
})

bar.setTotal(100)
bar.update(25)
console.log(bar.toString())
// Output: [=====>              ] 25% | 0:05<0:15
```

### Animated Spinner

```typescript
import { Progress } from '#'

const spinner = new Progress({
  style: 'custom',
  animate: true,
  template: '{bar} Processing...',
  animationFrames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
})

// Start animation
spinner.update(0)
```

### Custom Rendering Callback

```typescript
import { Progress } from '#'

const bar = new Progress()
bar.setTotal(100)

// Set custom render callback
bar.onRender((output) => {
  process.stdout.write(`\r${output}`)
})

// Update progress
for (let i = 0; i <= 100; i += 5) {
  bar.update(i)
  // Sleep for demonstration
  await new Promise(resolve => setTimeout(resolve, 100))
}
```

### Smooth Progress Bar

```typescript
import { Progress } from '#'

const bar = new Progress({
  width: 25,
  complete: '█',
  incomplete: ' ',
  style: 'smooth',
  template: '{bar} {percent}'
})

bar.setTotal(100)
bar.update(33)
console.log(bar.toString())
// Shows partial blocks for smoother representation
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
