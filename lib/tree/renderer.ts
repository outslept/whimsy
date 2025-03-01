import type { Children, Node } from './children'
import type { Enumerator, Indenter, StyleOptions, StyleType } from './enumerator'
import { Leaf, NodeChildren } from './children'
import { StylePreset } from './enumerator'
import { truncate, visibleLength } from './utils'

export type StyleFunc<T> = (children: Children<T>, index: number) => string

class RenderContext<T = unknown> {
  constructor(
    public readonly nodes: Node<T>[],
    public readonly prefixes: string[],
    public readonly maxPrefixLen: number,
  ) {}
}

export interface TreeRenderer<T> {
  render: (node: Node<T>, isRoot: boolean, prefix: string) => string
}

export interface RendererConfig<T> {
  style?: StyleType
  maxDepth?: number
  maxValueLength?: number
  truncate?: boolean
  truncateSuffix?: string
  styleOptions?: StyleOptions
  itemStyler?: StyleFunc<T>
  enumStyler?: StyleFunc<T>
  rootStyle?: (text: string) => string
  emptyNodeSymbol?: string
}

export class Renderer<T = unknown> implements TreeRenderer<T> {
  private enumerator: Enumerator
  private indenter: Indenter
  private itemStyle: StyleFunc<T> = () => ''
  private enumStyle: StyleFunc<T> = () => ''
  private rootStyle: (text: string) => string = text => text
  private depth = 0
  private readonly maxDepth: number
  private readonly maxValueLength: number
  private readonly shouldTruncate: boolean
  private readonly truncateSuffix: string
  private readonly emptyNodeSymbol: string
  private readonly styleType: StyleType
  private readonly styleOptions: StyleOptions

  constructor(config: RendererConfig<T> = {}) {
    this.styleType = config.style ?? 'ascii'
    this.styleOptions = config.styleOptions ?? {};
    [this.enumerator, this.indenter] = StylePreset.get(this.styleType, this.styleOptions)

    this.maxDepth = config.maxDepth ?? 100
    this.maxValueLength = config.maxValueLength ?? 0
    this.shouldTruncate = config.truncate ?? false
    this.truncateSuffix = config.truncateSuffix ?? '...'
    this.emptyNodeSymbol = config.emptyNodeSymbol ?? '(empty)'

    if (config.itemStyler) {
      this.itemStyle = config.itemStyler
    }

    if (config.enumStyler) {
      this.enumStyle = config.enumStyler
    }

    if (config.rootStyle) {
      this.rootStyle = config.rootStyle
    }
  }

  setEnumerator(fn: Enumerator): this {
    this.enumerator = fn
    return this
  }

  setIndenter(fn: Indenter): this {
    this.indenter = fn
    return this
  }

  setItemStyle(fn: StyleFunc<T>): this {
    this.itemStyle = fn
    return this
  }

  setEnumStyle(fn: StyleFunc<T>): this {
    this.enumStyle = fn
    return this
  }

  setRootStyle(styler: (text: string) => string): this {
    this.rootStyle = styler
    return this
  }

  setStylePreset(style: StyleType, options?: StyleOptions): this {
    [this.enumerator, this.indenter] = StylePreset.get(style, options)
    return this
  }

  private prepareContext(children: Children<T>): RenderContext<T> {
    const nodes = children.toArray()
    const prefixes = nodes.map((_, i) =>
      this.enumStyle(children, i) + this.enumerator(children, i),
    )
    return new RenderContext<T>(
      nodes,
      prefixes,
      Math.max(...prefixes.map(p => visibleLength(p)), 0),
    )
  }

  private formatValue(value: string): string {
    if (!value) {
      return this.emptyNodeSymbol
    }

    if (this.shouldTruncate && this.maxValueLength > 0) {
      return truncate(value, this.maxValueLength, this.truncateSuffix)
    }

    return value
  }

  render(node: Node<T>, isRoot: boolean, prefix: string): string {
    if (this.depth > this.maxDepth) {
      throw new Error(`Maximum rendering depth (${this.maxDepth}) exceeded`)
    }
    this.depth++
    try {
      if (node.hidden()) {
        return ''
      }

      const result: string[] = []
      const children = node.children()

      if (isRoot && node.value()) {
        result.push(this.rootStyle(this.formatValue(node.value())))
      }

      const context = this.prepareContext(children)

      for (let i = 0; i < context.nodes.length; i++) {
        const child = context.nodes[i]
        if (child.hidden()) {
          continue
        }

        const indent = this.indenter(children, i)
        let nodePrefix = context.prefixes[i]
        nodePrefix = nodePrefix.padEnd(context.maxPrefixLen, ' ')

        const item = this.itemStyle(children, i) + this.formatValue(child.value())
        const line = prefix + nodePrefix + item
        result.push(line)

        const childRenderer = child.getRenderer?.() || this
        const childOutput = childRenderer.render(
          child,
          false,
          prefix + this.enumStyle(children, i) + indent,
        )

        if (childOutput) {
          result.push(childOutput)
        }
      }

      return result.join('\n')
    }
    finally {
      this.depth--
    }
  }
}

export type TwigItem<T> = Twig<T> | Leaf<T> | string

export class Twig<T = unknown> implements Node<T> {
  private valueStr: string = ''
  private isHidden: boolean = false
  private childrenData: Children<T> = new NodeChildren<T>()
  private renderer: TreeRenderer<T> = new Renderer<T>()

  public data?: T

  value(): string {
    return this.valueStr
  }

  children(): Children<T> {
    return this.childrenData
  }

  hidden(): boolean {
    return this.isHidden
  }

  hide(hide: boolean): this {
    this.isHidden = hide
    return this
  }

  root(value: any): this {
    if (value instanceof Twig) {
      this.valueStr = value.value()
      this.childrenData = value.children()
      this.data = value.data
    }
    else {
      this.valueStr = String(value)
    }
    return this
  }

  child(...items: TwigItem<T>[]): this {
    const normalize = (item: TwigItem<T>): Node<T> => {
      if (typeof item === 'string') {
        return new Leaf<T>(item)
      }
      return item
    }

    const nodeChildren = this.childrenData as NodeChildren<T>
    let newChildren = nodeChildren

    for (const item of items) {
      if (Array.isArray(item)) {
        const container = new Twig<T>()
        container.childrenData = new NodeChildren<T>(item.map(normalize))
        newChildren = newChildren.append(container)
      }
      else {
        newChildren = newChildren.append(normalize(item))
      }
    }

    this.childrenData = newChildren
    return this
  }

  getRenderer(): Renderer<T> {
    return this.renderer as Renderer<T>
  }

  useRenderer(renderer: TreeRenderer<T>): this {
    this.renderer = renderer
    return this
  }

  stylePreset(type: StyleType, options?: StyleOptions): this {
    if (this.renderer instanceof Renderer) {
      this.renderer.setStylePreset(type, options)
    }
    return this
  }

  toString(): string {
    return this.renderer.render(this, true, '')
  }

  setData(data: T): this {
    this.data = data
    return this
  }

  clone(): Twig<T> {
    const newTwig = new Twig<T>()
    newTwig.valueStr = this.valueStr
    newTwig.isHidden = this.isHidden
    newTwig.data = this.data

    const children = this.childrenData.toArray()
    const newChildren = new NodeChildren<T>()

    for (const child of children) {
      if (child instanceof Twig) {
        newChildren.append(child.clone())
      }
      else if (child instanceof Leaf) {
        newChildren.append(
          new Leaf<T>(child.value(), child.hidden(), child.data),
        )
      }
    }

    newTwig.childrenData = newChildren

    newTwig.renderer = this.renderer
    return newTwig
  }
}

export class TwigBuilder<T = unknown> {
  private readonly root: Twig<T> = new Twig<T>()
  private currentNode: Twig<T>
  private nodeStack: Twig<T>[] = []

  constructor(value?: string) {
    this.currentNode = this.root
    if (value) {
      this.root.root(value)
    }
  }

  with(value: string): this {
    this.root.root(value)
    return this
  }

  add(child: Twig<T> | Leaf<T> | string): this {
    this.currentNode.child(child)
    return this
  }

  addMany(children: (Twig<T> | Leaf<T> | string)[]): this {
    this.currentNode.child(...children)
    return this
  }

  beginNode(value: string): this {
    this.nodeStack.push(this.currentNode)
    const newNode = new Twig<T>().root(value)
    this.currentNode.child(newNode)
    this.currentNode = newNode
    return this
  }

  endNode(): this {
    const parent = this.nodeStack.pop()
    if (!parent) {
      throw new Error('No active node to end')
    }
    this.currentNode = parent
    return this
  }

  style(type: StyleType, options?: StyleOptions): this {
    this.root.stylePreset(type, options)
    return this
  }

  data(data: T): this {
    this.currentNode.setData(data)
    return this
  }

  build(): Twig<T> {
    if (this.nodeStack.length > 0) {
      console.warn(`Warning: ${this.nodeStack.length} unclosed nodes. Returning to root.`)
      this.currentNode = this.root
      this.nodeStack = []
    }
    return this.root
  }
}
