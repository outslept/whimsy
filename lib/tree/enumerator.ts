import type { Children } from './children'
import picocolors from 'picocolors'

export type Enumerator = <T>(children: Children<T>, index: number) => string
export type Indenter = <T>(children: Children<T>, index: number) => string
export type StyleType = 'ascii' | 'rounded' | 'color' | 'minimal' | 'boxed' | 'double'

export interface StyleOptions {
  enableColors?: boolean
  enumColor?: string
  lineColor?: string
}

export class StylePreset {
  static get(
    style: StyleType,
    options: StyleOptions = {},
  ): [Enumerator, Indenter] {
    const useColor = options.enableColors ?? picocolors.isColorSupported
    const enumColor = options.enumColor ?? 'cyan'
    const lineColor = options.lineColor ?? 'gray'

    const colorize = (text: string, color: string): string => {
      if (!useColor)
        return text
      return (picocolors as any)[color](text)
    }

    switch (style) {
      case 'color':
        return [
          (c, i) => colorize(i === c.length() - 1 ? '└──' : '├──', enumColor),
          (c, i) => colorize(i === c.length() - 1 ? '   ' : '│  ', lineColor),
        ]
      case 'minimal':
        return [
          () => '',
          () => '  ',
        ]
      case 'rounded':
        return [
          (c, i) => i === c.length() - 1 ? '╰──' : '├──',
          (c, i) => i === c.length() - 1 ? '   ' : '│  ',
        ]
      case 'boxed':
        return [
          (c, i) => i === c.length() - 1 ? '└─┬' : '├─┬',
          (c, i) => i === c.length() - 1 ? '  │' : '│ │',
        ]
      case 'double':
        return [
          (c, i) => i === c.length() - 1 ? '╚══' : '╠══',
          (c, i) => i === c.length() - 1 ? '   ' : '║  ',
        ]
      default: // 'ascii'
        return [
          (c, i) => i === c.length() - 1 ? '\\--' : '|--',
          (c, i) => i === c.length() - 1 ? '   ' : '|  ',
        ]
    }
  }

  static custom(
    enumerator: Enumerator,
    indenter: Indenter,
  ): [Enumerator, Indenter] {
    return [enumerator, indenter]
  }
}
