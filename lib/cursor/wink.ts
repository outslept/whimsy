export enum CursorMode {
  Blink = 0,
  Static = 1,
  Hide = 2,
}

export interface CursorOptions {
  blinkSpeed?: number
  char?: string
  style?: TerminalStyle
  textStyle?: TerminalStyle
  mode?: CursorMode
}

export type WinkMsg =
  | { type: 'initialBlink' }
  | { type: 'blink', id: number, tag: number }
  | { type: 'blinkCanceled' }
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'updateOptions', options: Partial<CursorOptions> }

export type Command<T> = () => Promise<T>

export class TerminalStyle {
  private readonly styles: string[] = []
  private isInline = false

  constructor(styles: string[] = [], isInline = false) {
    this.styles = styles
    this.isInline = isInline
  }

  static create(): TerminalStyle {
    return new TerminalStyle()
  }

  clone(): TerminalStyle {
    return new TerminalStyle([...this.styles], this.isInline)
  }

  reverse(v: boolean): TerminalStyle {
    const style = this.clone()
    if (v)
      style.styles.push('\x1B[7m')
    return style
  }

  bold(v: boolean): TerminalStyle {
    const style = this.clone()
    if (v)
      style.styles.push('\x1B[1m')
    return style
  }

  color(code: number): TerminalStyle {
    const style = this.clone()
    style.styles.push(`\x1B[38;5;${code}m`)
    return style
  }

  bgColor(code: number): TerminalStyle {
    const style = this.clone()
    style.styles.push(`\x1B[48;5;${code}m`)
    return style
  }

  inline(v: boolean): TerminalStyle {
    const style = this.clone()
    style.isInline = v
    return style
  }

  render(text: string): string {
    if (this.styles.length === 0)
      return text
    const reset = this.isInline ? '' : '\x1B[0m'
    return `${this.styles.join('')}${text}${reset}`
  }
}

class BlinkContext {
  private timeoutId: ReturnType<typeof setTimeout> | null = null

  start(ms: number, callback: () => void): () => void {
    this.cancel()
    this.timeoutId = setTimeout(() => {
      callback()
      this.timeoutId = null
    }, ms)

    return this.cancel.bind(this)
  }

  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  isActive(): boolean {
    return this.timeoutId !== null
  }
}

export class Wink {
  private blinkSpeed: number = 530
  private style: TerminalStyle = new TerminalStyle()
  private textStyle: TerminalStyle = new TerminalStyle()
  private char: string = ' '
  private id: number = 0
  private readonly focus: boolean = false
  private blink: boolean = true
  private mode: CursorMode = CursorMode.Blink

  private readonly blinkContext = new BlinkContext()
  private blinkTag: number = 0

  constructor(options?: CursorOptions) {
    if (options)
      this.applyOptions(options)
  }

  update(msg: WinkMsg): [Wink, Command<WinkMsg> | null] {
    switch (msg.type) {
      case 'initialBlink':
        if (!this.shouldBlink())
          return [this, null]
        return [this, this.blinkCommand()]

      case 'focus':
        return [{ ...this, focus: true, blink: this.mode === CursorMode.Hide }, this.blinkCommand()]

      case 'blur':
        this.blinkContext.cancel()
        return [{ ...this, focus: false, blink: true }, null]

      case 'blink':
        if (!this.validateBlink(msg))
          return [this, null]
        return [{ ...this, blink: !this.blink }, this.blinkCommand()]

      case 'updateOptions':
        this.applyOptions(msg.options)
        return [this, this.shouldBlink() ? this.blinkCommand() : null]

      case 'blinkCanceled':
      default:
        return [this, null]
    }
  }

  private applyOptions(options: Partial<CursorOptions>): void {
    if (options.blinkSpeed !== undefined)
      this.blinkSpeed = options.blinkSpeed
    if (options.char !== undefined)
      this.char = options.char
    if (options.style !== undefined)
      this.style = options.style
    if (options.textStyle !== undefined)
      this.textStyle = options.textStyle
    if (options.mode !== undefined)
      this.setMode(options.mode)
  }

  private shouldBlink(): boolean {
    return this.mode === CursorMode.Blink && this.focus
  }

  private validateBlink(msg: { id: number, tag: number }): boolean {
    return (
      this.shouldBlink()
      && msg.id === this.id
      && msg.tag === this.blinkTag
    )
  }

  private blinkCommand(): Command<WinkMsg> | null {
    if (!this.shouldBlink())
      return null

    this.blinkContext.cancel()
    this.blinkTag++

    const currentTag = this.blinkTag
    const currentId = this.id

    return () =>
      new Promise((resolve) => {
        this.blinkContext.start(this.blinkSpeed, () => {
          resolve({ type: 'blink', id: currentId, tag: currentTag })
        })
      })
  }

  setMode(mode: CursorMode): void {
    if (mode < CursorMode.Blink || mode > CursorMode.Hide)
      return
    this.mode = mode
    this.blink = this.mode === CursorMode.Hide || !this.focus
  }

  getOptions(): CursorOptions {
    return {
      blinkSpeed: this.blinkSpeed,
      char: this.char,
      style: this.style.clone(),
      textStyle: this.textStyle.clone(),
      mode: this.mode,
    }
  }

  view(): string {
    if (this.mode === CursorMode.Hide)
      return ''

    if (this.blink) {
      return this.textStyle.inline(true).render(this.char)
    }

    return this.style.inline(true).reverse(true).render(this.char)
  }

  reset(): void {
    this.blinkContext.cancel()
    this.blinkTag = 0
    this.id++
    this.blink = true
  }

  isFocused(): boolean {
    return this.focus
  }

  getMode(): CursorMode {
    return this.mode
  }
}
