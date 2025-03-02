import pc from 'picocolors'
import { ProgressThemes } from './presets'

type ColorFunction = (text: string) => string

export interface ProgressBarOptions {
  width?: number
  complete?: string
  incomplete?: string
  head?: string
  template?: string
  clearOnUpdate?: boolean
  style?: 'block' | 'smooth' | 'gradient' | 'text' | 'braille' | 'custom'
  rtl?: boolean
  completeColor?: keyof typeof pc
  incompleteColor?: keyof typeof pc
  percentColor?: keyof typeof pc
  percentFormat?: 'percent' | 'ratio' | 'fraction' | 'none'
  decimals?: number
  showElapsed?: boolean
  showEta?: boolean
  timeFormat?: 'seconds' | 'compact' | 'hms'
  animate?: boolean
  animationFrames?: string[]
  partialBlocks?: string[]
}

export interface ProgressState {
  percent: number
  ratio: number
  elapsed: number
  eta: number
  value: number
  total: number
  complete: boolean
}

const DEFAULT_PARTIAL_BLOCKS = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉']

function formatTime(ms: number, format: 'seconds' | 'compact' | 'hms' = 'compact'): string {
  if (ms === Infinity || Number.isNaN(ms))
    return '-:--'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  switch (format) {
    case 'seconds':
      return `${seconds}s`
    case 'hms':
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`.replace(/^0h /, '').replace(/^0m /, '')
    case 'compact':
    default:
      if (hours > 0) {
        return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
      }
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }
}

// Функция для безопасного применения цвета
function applyColor(text: string, colorName: keyof typeof pc): string {
  const colorFn = pc[colorName]
  if (typeof colorFn === 'function') {
    return (colorFn as ColorFunction)(text)
  }
  return text
}

export class Progress {
  private options: Required<ProgressBarOptions>
  private startTime: number = Date.now()
  private lastRenderTime: number = 0
  private value: number = 0
  private total: number = 100
  private lastOutput: string = ''
  private animationIndex: number = 0
  private animationTimer: NodeJS.Timeout | null = null
  private renderCallback: ((output: string) => void) | null = null
  private updateInterval: number = 100
  private samples: { time: number, value: number }[] = []
  private readonly maxSamples: number = 10

  constructor(options: ProgressBarOptions = {}) {
    this.options = {
      width: 20,
      complete: '#',
      incomplete: '-',
      head: '',
      template: '[{bar}] {percent}',
      clearOnUpdate: true,
      style: 'block',
      rtl: false,
      completeColor: 'reset',
      incompleteColor: 'reset',
      percentColor: 'reset',
      percentFormat: 'percent',
      decimals: 0,
      showElapsed: false,
      showEta: false,
      timeFormat: 'compact',
      animate: false,
      animationFrames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
      partialBlocks: DEFAULT_PARTIAL_BLOCKS,
      ...options,
    }

    this.reset()
  }

  reset(): this {
    this.startTime = Date.now()
    this.value = 0
    this.samples = []
    this.stopAnimation()
    return this
  }

  setTotal(total: number): this {
    this.total = Math.max(0, total)
    return this
  }

  update(value: number, forceRender = false): this {
    const now = Date.now()
    const previousValue = this.value
    this.value = Math.max(0, Math.min(value, this.total))

    if (this.value > previousValue) {
      this.samples.push({ time: now, value: this.value })
      if (this.samples.length > this.maxSamples) {
        this.samples.shift()
      }
    }

    if (forceRender || (now - this.lastRenderTime >= this.updateInterval)) {
      this.render()
      this.lastRenderTime = now
    }

    if (this.options.animate && this.value < this.total) {
      this.startAnimation()
    }
    else if (this.value >= this.total) {
      this.stopAnimation()
    }

    return this
  }

  increment(amount = 1): this {
    return this.update(this.value + amount)
  }

  percent(percent: number): this {
    return this.update((percent / 100) * this.total)
  }

  complete(): this {
    return this.update(this.total, true)
  }

  configure(options: ProgressBarOptions): this {
    this.options = { ...this.options, ...options }
    return this
  }

  theme(themeName: keyof typeof ProgressThemes): this {
    const theme = ProgressThemes[themeName]
    if (theme) {
      this.configure(theme as ProgressBarOptions)
    }
    return this
  }

  onRender(callback: (output: string) => void): this {
    this.renderCallback = callback
    return this
  }

  setUpdateInterval(ms: number): this {
    this.updateInterval = ms
    return this
  }

  getState(): ProgressState {
    const ratio = this.total > 0 ? this.value / this.total : 0
    const percent = ratio * 100
    const elapsed = Date.now() - this.startTime
    const eta = this.calculateEta(elapsed, ratio)

    return {
      percent,
      ratio,
      elapsed,
      eta,
      value: this.value,
      total: this.total,
      complete: this.value >= this.total,
    }
  }

  private calculateEta(elapsed: number, ratio: number): number {
    if (ratio >= 1)
      return 0
    if (ratio <= 0 || this.samples.length < 2)
      return Infinity

    const first = this.samples[0]
    const last = this.samples[this.samples.length - 1]
    const valuePerMs = (last.value - first.value) / (last.time - first.time)

    if (valuePerMs <= 0)
      return Infinity

    const remaining = this.total - this.value
    return remaining / valuePerMs
  }

  private startAnimation(): void {
    if (this.animationTimer)
      return

    this.animationTimer = setInterval(() => {
      this.animationIndex = (this.animationIndex + 1) % this.options.animationFrames.length
      this.render()
    }, 80)
  }

  private stopAnimation(): void {
    if (this.animationTimer) {
      clearInterval(this.animationTimer)
      this.animationTimer = null
    }
  }

  render(): string {
    const state = this.getState()
    let output = ''

    if (this.options.clearOnUpdate && this.lastOutput) {
      output = '\r\x1B[K'
    }

    let bar: string
    switch (this.options.style) {
      case 'smooth':
        bar = this.renderSmoothBar(state.ratio)
        break
      case 'gradient':
        bar = this.renderGradientBar(state.ratio)
        break
      case 'text':
        bar = ''
        break
      case 'braille':
        bar = this.renderBrailleBar(state.ratio)
        break
      case 'custom':
        if (this.options.animate) {
          bar = this.options.animationFrames[this.animationIndex]
        }
        else {
          bar = this.options.complete
        }
        break
      case 'block':
      default:
        bar = this.renderBlockBar(state.ratio)
        break
    }

    let percentText: string
    switch (this.options.percentFormat) {
      case 'ratio':
        percentText = `${this.value}/${this.total}`
        break
      case 'fraction':
        percentText = state.ratio.toFixed(2)
        break
      case 'none':
        percentText = ''
        break
      case 'percent':
      default:
        percentText = `${state.percent.toFixed(this.options.decimals)}%`
        break
    }

    if (this.options.percentColor !== 'reset') {
      percentText = applyColor(percentText, this.options.percentColor)
    }

    const elapsedText = this.options.showElapsed
      ? formatTime(state.elapsed, this.options.timeFormat)
      : ''

    const etaText = this.options.showEta
      ? formatTime(state.eta, this.options.timeFormat)
      : ''

    output += this.options.template
      .replace('{bar}', bar)
      .replace('{percent}', percentText)
      .replace('{ratio}', `${this.value}/${this.total}`)
      .replace('{value}', this.value.toString())
      .replace('{total}', this.total.toString())
      .replace('{elapsed}', elapsedText)
      .replace('{eta}', etaText)

    this.lastOutput = output

    if (this.renderCallback) {
      this.renderCallback(output)
    }

    return output
  }

  private renderBlockBar(ratio: number): string {
    const width = this.options.width
    const completeLength = Math.floor(width * ratio)
    const incompleteLength = width - completeLength - (this.options.head ? 1 : 0)

    let completeStr = this.options.complete.repeat(completeLength)
    let incompleteStr = this.options.incomplete.repeat(Math.max(0, incompleteLength))
    let headStr = completeLength < width && this.options.head ? this.options.head : ''

    if (this.options.completeColor !== 'reset') {
      completeStr = applyColor(completeStr, this.options.completeColor)
    }

    if (this.options.incompleteColor !== 'reset') {
      incompleteStr = applyColor(incompleteStr, this.options.incompleteColor)
    }

    if (headStr && this.options.completeColor !== 'reset') {
      headStr = applyColor(headStr, this.options.completeColor)
    }

    return this.options.rtl
      ? incompleteStr + headStr + completeStr
      : completeStr + headStr + incompleteStr
  }

  private renderSmoothBar(ratio: number): string {
    const width = this.options.width
    const completeWidth = width * ratio
    const completeBlockCount = Math.floor(completeWidth)
    const partialBlockIndex = Math.floor((completeWidth - completeBlockCount) * this.options.partialBlocks.length)

    let completeStr = this.options.complete.repeat(completeBlockCount)
    let partialStr = partialBlockIndex > 0 ? this.options.partialBlocks[partialBlockIndex] : ''
    let incompleteStr = this.options.incomplete.repeat(
      Math.max(0, width - completeBlockCount - (partialStr ? 1 : 0)),
    )

    if (this.options.completeColor !== 'reset') {
      completeStr = applyColor(completeStr, this.options.completeColor)
      if (partialStr) {
        partialStr = applyColor(partialStr, this.options.completeColor)
      }
    }

    if (this.options.incompleteColor !== 'reset') {
      incompleteStr = applyColor(incompleteStr, this.options.incompleteColor)
    }

    return this.options.rtl
      ? incompleteStr + partialStr + completeStr
      : completeStr + partialStr + incompleteStr
  }

  private renderGradientBar(ratio: number): string {
    const width = this.options.width
    const completeLength = Math.floor(width * ratio)
    const incompleteLength = width - completeLength

    let completeStr = this.options.complete.repeat(completeLength)
    let incompleteStr = this.options.incomplete.repeat(incompleteLength)

    if (this.options.completeColor !== 'reset') {
      completeStr = applyColor(completeStr, this.options.completeColor)
    }

    if (this.options.incompleteColor !== 'reset') {
      incompleteStr = applyColor(incompleteStr, this.options.incompleteColor)
    }

    return this.options.rtl
      ? incompleteStr + completeStr
      : completeStr + incompleteStr
  }

  private renderBrailleBar(ratio: number): string {
    const width = this.options.width
    const completeLength = Math.floor(width * ratio)
    const incompleteLength = width - completeLength

    let completeStr = this.options.complete.repeat(completeLength)
    let incompleteStr = this.options.incomplete.repeat(incompleteLength)

    if (this.options.completeColor !== 'reset') {
      completeStr = applyColor(completeStr, this.options.completeColor)
    }

    if (this.options.incompleteColor !== 'reset') {
      incompleteStr = applyColor(incompleteStr, this.options.incompleteColor)
    }

    return this.options.rtl
      ? incompleteStr + completeStr
      : completeStr + incompleteStr
  }

  toString(): string {
    return this.render()
  }
}
