# Chrono

An immutable timer library for tracking elapsed time. Part of the Whimsy.

## Features

- **Immutable design** - All operations return new timer instances for predictable state management
- **Flexible formatting** - Multiple time display formats for different use cases
- **High precision** - Configurable tick intervals down to milliseconds
- **Functional approach** - Clean API with preset configurations
- **Type safety** - Full TypeScript support with comprehensive type definitions
- **Zero dependencies** - Lightweight and self-contained

## Basic Usage

```typescript
import { Chrono } from 'chrono'

// Create a timer
const [timer, command] = Chrono.create()

// Start the timer
const [runningTimer, tickCommand] = timer.start()

// Process timer ticks
async function updateTimer() {
  const msg = await tickCommand()
  const [updatedTimer, nextCommand] = runningTimer.update(msg)

  console.log(`Elapsed time: ${updatedTimer.formatted}`)

  // Continue updating
  if (nextCommand) {
    return updateTimer()
  }
}

// Stop the timer after 5 seconds
setTimeout(() => {
  const stoppedTimer = runningTimer.stop()
  console.log(`Final time: ${stoppedTimer.formatted}`)
}, 5000)

// Start updating
updateTimer()
```

## API Reference

### Creating a Timer

```typescript
// Basic timer with default options (100ms tick interval)
const [timer, command] = Chrono.create()

// Timer with custom options
const [timer, command] = Chrono.create({
  config: {
    tickInterval: 500,
    precision: 2,
    formatStyle: 'compact'
  }
})

// Quick presets
const [swiftTimer, command] = Chrono.swift() // 100ms interval, 1 decimal place
const [preciseTimer, command] = Chrono.precise() // 10ms interval, 2 decimal places
```

### Timer Options

| Option         | Type                                   | Default     | Description                          |
| -------------- | -------------------------------------- | ----------- | ------------------------------------ |
| `tickInterval` | `number`                               | `100`       | Time in ms between timer ticks       |
| `precision`    | `number`                               | `1`         | Decimal places to show in seconds    |
| `formatStyle`  | `'compact' \| 'standard' \| 'verbose'` | `'compact'` | Style for displaying time            |
| `autoStart`    | `boolean`                              | `false`     | Whether to start timer upon creation |

### Available Presets

```typescript
// Simple timer with 1-second intervals
const [timer, command] = ChronoPresets.simple()

// Fitness timer with sports-style formatting (00:00.0)
const [timer, command] = ChronoPresets.fitness()

// Meditation timer with verbose time formatting (&quot;5 minutes 30 seconds&quot;)
const [timer, command] = ChronoPresets.meditation()

// Laboratory timer with high precision for scientific measurements
const [timer, command] = ChronoPresets.laboratory()
```

### Methods

#### Control Methods

```typescript
// Start the timer
const [runningTimer, tickCommand] = timer.start()

// Stop the timer without resetting
const stoppedTimer = runningTimer.stop()

// Toggle between running and stopped states
const [toggledTimer, maybeCommand] = timer.toggle()

// Reset the elapsed time to zero
const resetTimer = timer.reset()

// Adjust the elapsed time (positive or negative milliseconds)
const adjustedTimer = timer.adjust(5000) // Add 5 seconds

// Update configuration
const reconfiguredTimer = timer.configure({
  precision: 3,
  tickInterval: 50
})

// Process a timer message
const [updatedTimer, nextCommand] = timer.update(message)
```

### Time Formatters

```typescript
// Default compact format: 1h2m3.5s
const formatted = timer.formatted

// Sports-style format: 01:23.5
const sportsTime = TimeFormatters.sporty(timer.state.elapsed)

// Scientific format: 83.500s
const scientificTime = TimeFormatters.scientific(timer.state.elapsed)

// Verbose format: 1 hour 23 minutes 30 seconds
const verboseTime = TimeFormatters.verbose(timer.state.elapsed)
```

## Examples

### Basic Timer

```typescript
import { Chrono } from 'chrono'

// Create and start a timer
const [chrono, startCommand] = Chrono.create({
  config: { tickInterval: 1000 }
})
const [runningChrono, tickCommand] = chrono.start()

// Process timer updates
async function processTimer(currentChrono, command) {
  const msg = await command()
  const [updatedChrono, nextCommand] = currentChrono.update(msg)

  console.log(`Time: ${updatedChrono.formatted}`)

  return processTimer(updatedChrono, nextCommand)
}

// Start processing
processTimer(runningChrono, tickCommand)
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
