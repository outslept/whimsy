/**
 * Messages that can be sent to and from the Chrono timer.
 * Each message has a type and an ID to identify the target Chrono instance,
 */
type ChronoMessage =
  /** Increments the timer by one tick interval */
  | { type: 'tick', id: string, sequence: number }
  /** Starts or stops the timer */
  | { type: 'toggle', id: string, running: boolean }
  /** Resets the timer to zero */
  | { type: 'reset', id: string }
  /** Adjusts the elapsed time by the specified amount in milliseconds */
  | { type: 'adjust', id: string, adjustment: number }
  /** Updates the timer configuration */
  | { type: 'configure', id: string, config: Partial<ChronoConfig> }

interface ChronoConfig {
  /** Time in milliseconds between timer ticks */
  tickInterval: number
  /** Number of decimal places to display in the formatted time */
  precision: number
  /** Style of time formatting to use */
  formatStyle: 'compact' | 'standard' | 'verbose'
  /** Whether the timer should start immediately upon creation */
  autoStart: boolean
}

/**
 * A function that formats a time duration in milliseconds into a string representation.
 */
type TimeFormatter = (milliseconds: number, precision?: number) => string

class Chrono {
  /** Counter to generate unique IDs for timer instances */
  private static idCounter = 0

  /** Unique identifier for this timer instance */
  readonly id: string
  /** Sequence number to track and validate tick messages */
  private sequence: number = 0
  /** Whether the timer is currently running */
  private running: boolean
  /** Total elapsed time in milliseconds */
  private elapsed: number = 0
  /** Configuration settings for this timer */
  private readonly config: ChronoConfig
  /** Function used to format the elapsed time for display */
  private readonly formatter: TimeFormatter

  /** Creates a new Chrono instance. Use static factory methods instead of calling directly. */
  private constructor(
    id: string | undefined,
    config: Partial<ChronoConfig> = {},
    formatter?: TimeFormatter,
  ) {
    this.id = id ?? `chrono-${++Chrono.idCounter}`
    this.config = {
      tickInterval: config.tickInterval ?? 100,
      precision: config.precision ?? 1,
      formatStyle: config.formatStyle ?? 'compact',
      autoStart: config.autoStart ?? false,
    }
    this.running = this.config.autoStart
    this.formatter = formatter ?? formatTime
  }

  /**
   * Creates a new Chrono instance with the specified configuration.
   */
  static create(options: {
    id?: string
    config?: Partial<ChronoConfig>
    formatter?: TimeFormatter
  } = {}): [Chrono, (() => Promise<ChronoMessage>) | null] {
    const ticker = new Chrono(options.id, options.config, options.formatter)

    return ticker.config.autoStart
      ? [ticker, ticker.createTickCommand()]
      : [ticker, null]
  }

  /**
   * Creates a timer with 100ms tick interval and 1 decimal place precision.
   * Useful for UI updates that need to be responsive but not too resource-intensive.
   */
  static swift(): [Chrono, (() => Promise<ChronoMessage>) | null] {
    return Chrono.create({
      config: { tickInterval: 100, precision: 1 },
    })
  }

  /**
   * Creates a high-precision timer with 10ms tick interval and 2 decimal places precision.
   * Useful for timing operations that require high accuracy.
   */
  static precise(): [Chrono, (() => Promise<ChronoMessage>) | null] {
    return Chrono.create({
      config: { tickInterval: 10, precision: 2 },
    })
  }

  /**
   * Starts the timer.
   */
  start(): [Chrono, () => Promise<ChronoMessage>] {
    if (this.running)
      return [this, this.createTickCommand()]

    const updated = this.copyWith({ running: true })
    return [updated, updated.createTickCommand()]
  }

  /**
   * Stops the timer without resetting the elapsed time.
   */
  stop(): Chrono {
    return this.copyWith({ running: false })
  }

  /**
   * Toggles the timer between running and stopped states.
   */
  toggle(): [Chrono, (() => Promise<ChronoMessage>) | null] {
    return this.running
      ? [this.stop(), null]
      : this.start()
  }

  /**
   * Resets the timer to zero without changing its running state.
   */
  reset(): Chrono {
    return this.copyWith({ elapsed: 0, sequence: 0 })
  }

  /**
   * Adjusts the elapsed time by adding or subtracting milliseconds.
   * Elapsed time will not go below zero.
   */
  adjust(adjustment: number): Chrono {
    const newElapsed = Math.max(0, this.elapsed + adjustment)
    return this.copyWith({ elapsed: newElapsed })
  }

  /**
   * Updates the timer configuration with new settings.
   */
  configure(newConfig: Partial<ChronoConfig>): Chrono {
    return this.copyWith({
      config: { ...this.config, ...newConfig },
    })
  }

  /**
   * Processes a message to update the timer state.
   */
  update(msg: ChronoMessage): [Chrono, (() => Promise<ChronoMessage>) | null] {
    if (msg.id !== this.id)
      return [this, null]

    switch (msg.type) {
      case 'tick':
        return this.handleTick(msg)
      case 'toggle':
        return this.handleToggle(msg)
      case 'reset':
        return [this.reset(), null]
      case 'adjust':
        return [this.adjust(msg.adjustment), null]
      case 'configure':
        return [this.configure(msg.config), null]
      default:
        return [this, null]
    }
  }

  /**
   * Returns the current state of the timer.
   */
  get state(): {
    id: string
    running: boolean
    elapsed: number
    formatted: string
  } {
    return {
      id: this.id,
      running: this.running,
      elapsed: this.elapsed,
      formatted: this.formatted,
    }
  }

  /**
   * Returns the formatted elapsed time as a string.
   * The formatting is determined by the timer configuration.
   */
  get formatted(): string {
    return this.formatter(this.elapsed, this.config.precision)
  }

  /**
   * Handles a tick message by updating the elapsed time and sequence number.
   */
  private handleTick(msg: { sequence: number }): [Chrono, (() => Promise<ChronoMessage>) | null] {
    if (!this.running || msg.sequence !== this.sequence) {
      return [this, null]
    }

    const updated = this.copyWith({
      elapsed: this.elapsed + this.config.tickInterval,
      sequence: this.sequence + 1,
    })

    return [updated, updated.createTickCommand()]
  }

  /**
   * Handles a toggle message by updating the running state.
   */
  private handleToggle(msg: { running: boolean }): [Chrono, (() => Promise<ChronoMessage>) | null] {
    const updated = this.copyWith({ running: msg.running })
    return msg.running
      ? [updated, updated.createTickCommand()]
      : [updated, null]
  }

  /**
   * Creates a copy of the Chrono instance with the specified properties.
   */
  private copyWith(params: {
    running?: boolean
    elapsed?: number
    sequence?: number
    config?: ChronoConfig
  }): Chrono {
    const copy = new Chrono(
      this.id,
      params.config ?? this.config,
      this.formatter,
    )

    copy.running = params.running ?? this.running
    copy.elapsed = params.elapsed ?? this.elapsed
    copy.sequence = params.sequence ?? this.sequence

    return copy
  }

  /**
   * Creates a function that can be used to send a tick message to the timer.
   */
  private createTickCommand(): () => Promise<ChronoMessage> {
    const currentSequence = this.sequence
    const currentId = this.id
    const interval = this.config.tickInterval

    return () => new Promise((resolve) => {
      setTimeout(() => resolve({
        type: 'tick',
        id: currentId,
        sequence: currentSequence,
      }), interval)
    })
  }
}

/**
 * Formats a time duration in milliseconds into a string representation.
 */
function formatTime(milliseconds: number, precision: number = 1): string {
  const totalSeconds = milliseconds / 1000

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const formattedSeconds = precision > 0
    ? seconds.toFixed(precision).replace(/\.?0+$/, '')
    : Math.floor(seconds).toString()

  const parts: string[] = []

  if (hours > 0)
    parts.push(`${hours}h`)
  if (minutes > 0 || hours > 0)
    parts.push(`${minutes}m`)
  parts.push(`${formattedSeconds}s`)

  return parts.join('')
}

/**
 * A collection of predefined time formatters.
 * Each formatter takes a time duration in milliseconds and a precision as arguments.
 */
const TimeFormatters = {
  sporty: (ms: number, precision: number = 1): string => {
    const totalSeconds = ms / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const fractional = Math.floor((totalSeconds % 1) * 10 ** precision)

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${fractional}`
  },

  scientific: (ms: number, precision: number = 3): string => {
    return `${(ms / 1000).toFixed(precision)}s`
  },

  verbose: (ms: number): string => {
    const seconds = ms / 1000

    if (seconds < 60) {
      return `${seconds.toFixed(1)} seconds`
    }
    else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}${
        remainingSeconds > 0 ? ` ${remainingSeconds.toFixed(0)} ${remainingSeconds === 1 ? 'second' : 'seconds'}` : ''
      }`
    }
    else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}${
        minutes > 0 ? ` ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : ''
      }`
    }
  },
}

const ChronoPresets = {
  simple: () => Chrono.create({
    config: { tickInterval: 1000, precision: 0, formatStyle: 'compact' },
  }),

  fitness: () => {
    const [ticker, cmd] = Chrono.create({
      config: { tickInterval: 100, precision: 1, autoStart: true },
      formatter: TimeFormatters.sporty,
    })
    return [ticker, cmd]
  },

  meditation: () => {
    const [ticker, cmd] = Chrono.create({
      config: { tickInterval: 1000, precision: 0 },
      formatter: TimeFormatters.verbose,
    })
    return [ticker, cmd]
  },

  laboratory: () => {
    const [ticker, cmd] = Chrono.create({
      config: { tickInterval: 10, precision: 3 },
      formatter: TimeFormatters.scientific,
    })
    return [ticker, cmd]
  },
}

export {
  Chrono,
  type ChronoConfig,
  type ChronoMessage,
  ChronoPresets,
  type TimeFormatter,
  TimeFormatters,
}
