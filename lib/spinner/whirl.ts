/**
 * A lightweight, customizable terminal spinner library for Node.js.
 *
 * This module provides a spinner implementation with various styles and customization options for CLI apps.
 * Part of Whimsy.
 */

import type { Buffer } from 'node:buffer'
import process from 'node:process'
import { setTimeout } from 'node:timers'
import pc from 'picocolors'

interface SpinnerStyle {
  frames: string[] // Animation frames to cycle through
  interval: number // Time in ms between frame changes
}

interface SpinnerOptions {
  text?: string // Text displayed after the spinner
  prefixText?: string | (() => string) // Text displayed before the spinner
  suffixText?: string | (() => string) // Text displayed after the main text
  spinner?: keyof typeof spinnerStyles | SpinnerStyle // Spinner style to use
  color?: keyof typeof pc | boolean // Color for the spinner
  hideCursor?: boolean // Whether to hide the cursor during spinning
  indent?: number // Number of spaces to indent the spinner
  interval?: number // Time in ms between spinner frames
  stream?: NodeJS.WriteStream // Stream to write spinner output to
  isEnabled?: boolean // Whether the spinner is enabled
  isSilent?: boolean // Whether to suppress all output
  discardStdin?: boolean // Whether to discard stdin input
}

/**
 * Collection of predefined spinner styles.
 * Each style defines a set of frames and the interval between frame changes.
 */
const spinnerStyles = {
  dots: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 120,
  },
  line: {
    frames: ['|', '/', '-', '\\'],
    interval: 100,
  },
  dots2: {
    frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
    interval: 80,
  },
  pulse: {
    frames: ['█', '▓', '▒', '░', '▒', '▓'],
    interval: 100,
  },
  points: {
    frames: ['∙∙∙', '●∙∙', '∙●∙', '∙∙●'],
    interval: 120,
  },
  whimsy: {
    frames: ['✧', '✦', '✧', '✦', '✧', '✦'],
    interval: 100,
  },
  magic: {
    frames: ['⊹', '⊹✧', '⊹✧˚', '⊹✧˚⋆', '✧˚⋆', '˚⋆', '⋆', ''],
    interval: 80,
  },
  fairy: {
    frames: ['∗', '∗⋆', '∗⋆✩', '⋆✩', '✩', '✩∗', '✩∗⋆', '∗⋆'],
    interval: 90,
  },
}

/**
 * Symbols used for different status indicators when a spinner completes.
 */
const symbols = {
  success: '✔',
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
}

class Whirl {
  private _text: string
  private _prefixText: string | (() => string)
  private _suffixText: string | (() => string)
  private _spinner: SpinnerStyle
  private _color: keyof typeof pc | boolean
  private _indent: number
  private readonly _stream: NodeJS.WriteStream
  private readonly _isEnabled: boolean
  private readonly _isSilent: boolean
  private readonly _hideCursor: boolean
  private _interval: number
  private _id: NodeJS.Timeout | null = null
  private _frameIndex = 0
  private _isSpinning = false

  /**
   * Creates a new spinner instance.
   *
   * Accepts either a string (used as the spinner text) or a configuration object.
   */
  constructor(options: string | SpinnerOptions = {}) {
    if (typeof options === 'string') {
      options = { text: options }
    }

    // Initialize properties with defaults or provided options
    this._text = options.text ?? ''
    this._prefixText = options.prefixText ?? ''
    this._suffixText = options.suffixText ?? ''
    this._indent = options.indent ?? 0
    this._color = options.color ?? 'cyan'
    this._hideCursor = options.hideCursor !== false
    this._stream = options.stream ?? process.stderr

    // Set spinner style
    if (!options.spinner) {
      this._spinner = spinnerStyles.dots
    }
    else if (typeof options.spinner === 'string') {
      this._spinner = spinnerStyles[options.spinner] ?? spinnerStyles.dots
    }
    else {
      this._spinner = options.spinner
    }

    this._interval = options.interval ?? this._spinner.interval

    // Determine if spinner should be enabled based on environment
    const isTTY = this._stream.isTTY
    const isCI = process.env.CI === 'true' || process.env.CI === '1'
    this._isEnabled = options.isEnabled ?? (isTTY && !isCI)
    this._isSilent = options.isSilent ?? false

    // Handle keyboard input (e.g., Ctrl+C)
    if (options.discardStdin !== false && isTTY && process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
      process.stdin.on('data', this._handleInput.bind(this))
    }
  }

  /**
   * Handles input from stdin, specifically watching for Ctrl+C (SIGINT).
   * This ensures the process exits cleanly when the user presses Ctrl+C.
   */
  private _handleInput(data: Buffer): void {
    if (data.toString() === '\u0003') {
      process.exit(130) // 130 is the standard exit code for SIGINT
    }
  }

  /**
   * Gets the next frame in the spinner animation sequence.
   * Cycles through frames and returns to the beginning when reaching the end.
   */
  private _frame(): string {
    const frame = this._spinner.frames[this._frameIndex]
    this._frameIndex = (this._frameIndex + 1) % this._spinner.frames.length
    return frame
  }

  /**
   * Applies the configured color to the provided text if coloring is enabled.
   */
  private _applyColor(text: string): string {
    if (!this._color)
      return text

    if (typeof this._color === 'string' && this._color in pc) {
      const colorFn = pc[this._color as keyof typeof pc] as (text: string) => string
      return colorFn(text)
    }

    return text
  }

  private _lastOutput = ''

  /**
   * Renders the current frame of the spinner to the output stream.
   * Handles text wrapping and ensures proper clearing of previous output.
   */
  private _render(): void {
    if (!this._isEnabled || this._isSilent)
      return

    const prefix = typeof this._prefixText === 'function' ? this._prefixText() : this._prefixText
    const suffix = typeof this._suffixText === 'function' ? this._suffixText() : this._suffixText
    const frame = this._frame()
    const text = this._text

    const output = [
      ' '.repeat(this._indent),
      prefix ? `${prefix} ` : '',
      this._applyColor(frame),
      text ? ` ${text}` : '',
      suffix ? ` ${suffix}` : '',
    ].join('')

    // Move cursor to start of line
    this._stream.write('\r')

    // Write the new output
    this._stream.write(output)

    // If previous output was longer, fill the remaining space with spaces
    if (this._lastOutput.length > output.length) {
      this._stream.write(`${' '.repeat(this._lastOutput.length - output.length)}\r${output}`)
    }

    // Store current output for next comparison
    this._lastOutput = output
  }

  /**
   * Clears the spinner output from the terminal.
   * Useful when you want to remove the spinner without showing a completion state.
   */
  clear(): this {
    if (!this._isEnabled || this._isSilent)
      return this

    // Clear the line by writing spaces and returning to start
    this._stream.write(`\r${' '.repeat(this._lastOutput.length)}\r`)
    this._lastOutput = ''

    return this
  }

  /**
   * Hides the terminal cursor.
   * Used when starting the spinner to prevent the cursor from flickering.
   */
  private _hideCursorImpl(): void {
    if (this._hideCursor && this._isEnabled) {
      this._stream.write('\u001B[?25l') // ANSI escape sequence to hide cursor
    }
  }

  /**
   * Shows the terminal cursor.
   * Used when stopping the spinner to restore normal terminal behavior.
   */
  private _showCursorImpl(): void {
    if (this._hideCursor && this._isEnabled) {
      this._stream.write('\u001B[?25h') // ANSI escape sequence to show cursor
    }
  }

  /**
   * Starts the spinner animation.
   * If already spinning, this method has no effect.
   *
   * Can optionally update the spinner text when starting.
   */
  start(text?: string): this {
    if (text)
      this._text = text

    if (this._isSpinning)
      return this

    if (this._hideCursor) {
      this._hideCursorImpl()
    }

    this._isSpinning = true
    this._frameIndex = 0
    this._render()

    // Use setTimeout for first frame to ensure consistent timing
    this._id = setTimeout(() => {
      this._render()

      // Then switch to setInterval for subsequent frames
      this._id = setInterval(() => {
        this._render()
      }, this._interval) as unknown as NodeJS.Timeout
    }, this._interval)

    return this
  }

  /**
   * Stops the spinner animation.
   * Clears the output and shows the cursor if it was hidden.
   */
  stop(): this {
    if (!this._isSpinning)
      return this

    if (this._id !== null) {
      clearInterval(this._id)
      this._id = null
    }

    this._isSpinning = false
    this.clear()
    this._showCursorImpl()

    return this
  }

  /**
   * Stops the spinner and shows a success symbol with the optional text.
   * The symbol and text are colored green by default.
   */
  succeed(text?: string): this {
    return this.stopAndPersist({ symbol: symbols.success, text, color: 'green' })
  }

  /**
   * Stops the spinner and shows an error symbol with the optional text.
   * The symbol and text are colored red by default.
   */
  fail(text?: string): this {
    return this.stopAndPersist({ symbol: symbols.error, text, color: 'red' })
  }

  /**
   * Stops the spinner and shows a warning symbol with the optional text.
   * The symbol and text are colored yellow by default.
   */
  warn(text?: string): this {
    return this.stopAndPersist({ symbol: symbols.warning, text, color: 'yellow' })
  }

  /**
   * Stops the spinner and shows an info symbol with the optional text.
   * The symbol and text are colored blue by default.
   */
  info(text?: string): this {
    return this.stopAndPersist({ symbol: symbols.info, text, color: 'blue' })
  }

  /**
   * Stops the spinner and displays a custom symbol with text.
   * This is the core method used by succeed(), fail(), warn(), and info().
   */
  stopAndPersist(options: {
    symbol?: string
    text?: string
    prefixText?: string | (() => string)
    suffixText?: string | (() => string)
    color?: keyof typeof pc
  } = {}): this {
    const prevColor = this._color

    if (options.color) {
      this._color = options.color
    }

    const text = options.text ?? this._text
    const prefixText = options.prefixText ?? this._prefixText
    const suffixText = options.suffixText ?? this._suffixText
    const symbol = options.symbol ?? ' '

    this.stop()

    if (!this._isSilent) {
      const prefix = typeof prefixText === 'function' ? prefixText() : prefixText
      const suffix = typeof suffixText === 'function' ? suffixText() : suffixText

      const line = [
        ' '.repeat(this._indent),
        prefix ? `${prefix} ` : '',
        this._applyColor(symbol),
        text ? ` ${text}` : '',
        suffix ? ` ${suffix}` : '',
      ].join('')

      // Write the final state with a newline
      this._stream.write(`${line}\n`)
    }

    // Restore original color
    this._color = prevColor

    return this
  }

  /**
   * Forces an immediate render of the spinner.
   * Useful when you've changed properties and want to see the changes immediately.
   */
  render(): this {
    if (this._isSpinning) {
      this._render()
    }
    return this
  }

  /**
   * Returns the current frame without rendering it.
   * Useful for custom rendering scenarios.
   */
  frame(): string {
    return this._frame()
  }

  /**
   * Gets the current spinner text.
   */
  get text(): string {
    return this._text
  }

  /**
   * Sets the spinner text and re-renders if currently spinning.
   */
  set text(value: string) {
    this._text = value
    if (this._isSpinning) {
      this._render()
    }
  }

  /**
   * Gets the current prefix text.
   */
  get prefixText(): string | (() => string) {
    return this._prefixText
  }

  /**
   * Sets the prefix text and re-renders if currently spinning.
   */
  set prefixText(value: string | (() => string)) {
    this._prefixText = value
    if (this._isSpinning) {
      this._render()
    }
  }

  /**
   * Gets the current suffix text.
   */
  get suffixText(): string | (() => string) {
    return this._suffixText
  }

  /**
   * Sets the suffix text and re-renders if currently spinning.
   */
  set suffixText(value: string | (() => string)) {
    this._suffixText = value
    if (this._isSpinning) {
      this._render()
    }
  }

  /**
   * Gets the current color setting.
   */
  get color(): keyof typeof pc | boolean {
    return this._color
  }

  /**
   * Sets the color and re-renders if currently spinning.
   */
  set color(value: keyof typeof pc | boolean) {
    this._color = value
    if (this._isSpinning) {
      this._render()
    }
  }

  /**
   * Gets the current spinner style.
   */
  get spinner(): SpinnerStyle {
    return this._spinner
  }

  /**
   * Sets a new spinner style and updates the animation.
   * This will reset the animation interval and frame index.
   */
  set spinner(value: keyof typeof spinnerStyles | SpinnerStyle) {
    if (typeof value === 'string') {
      this._spinner = spinnerStyles[value] ?? spinnerStyles.dots
    }
    else {
      this._spinner = value
    }

    this._interval = this._spinner.interval

    // If currently spinning, restart the animation with the new spinner
    if (this._isSpinning) {
      if (this._id !== null) {
        clearInterval(this._id)
      }

      this._frameIndex = 0
      this._render()

      this._id = setInterval(() => {
        this._render()
      }, this._interval) as unknown as NodeJS.Timeout
    }
  }

  /**
   * Gets the current indent level.
   */
  get indent(): number {
    return this._indent
  }

  /**
   * Sets the indent level and re-renders if currently spinning.
   */
  set indent(value: number) {
    this._indent = value
    if (this._isSpinning) {
      this._render()
    }
  }

  /**
   * Gets the current interval between frames in milliseconds.
   */
  get interval(): number {
    return this._interval
  }

  /**
   * Gets whether the spinner is currently animating.
   */
  get isSpinning(): boolean {
    return this._isSpinning
  }
}

/**
 * Helper function that wraps a Promise with a spinner.
 * Shows the spinner while the promise is pending, and updates with success or failure
 * when the promise resolves or rejects.
 *
 * @example
 * ```typescript
 * await whirlPromise(fetchData(), "Loading data...");
 * ```
 *
 * @example
 * ```typescript
 * const result = await whirlPromise(
 *   async (spinner) => {
 *     spinner.text = "Step 1";
 *     await step1();
 *     spinner.text = "Step 2";
 *     return await step2();
 *   },
 *   { text: "Processing...", successText: "All done!" }
 * );
 * ```
 */
async function whirlPromise<T>(
  action: Promise<T> | ((spinner: Whirl) => Promise<T>),
  options: string | SpinnerOptions & {
    successText?: string | ((result: T) => string)
    failText?: string | ((error: Error) => string)
  } = {},
): Promise<T> {
  if (typeof options === 'string') {
    options = { text: options }
  }

  const { successText, failText, ...spinnerOptions } = options
  const spinner = new Whirl(spinnerOptions).start()

  try {
  // Handle both direct promises and functions that return promises
    const promise = typeof action === 'function' ? action(spinner) : action
    const result = await promise

    // Determine success text (static or dynamic based on result)
    let text
    if (successText) {
      text = typeof successText === 'function' ? successText(result) : successText
    }

    spinner.succeed(text)
    return result
  }
  catch (error) {
  // Determine failure text (static or dynamic based on error)
    let text
    if (failText) {
      text = typeof failText === 'function' ? failText(error as Error) : failText
    }

    spinner.fail(text)
    throw error // Re-throw to allow caller to handle the error
  }
}

export {
  SpinnerOptions,
  SpinnerStyle,
  Whirl,
  whirlPromise,
}
