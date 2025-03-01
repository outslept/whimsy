import type { Renderer } from './renderer'

export interface Node<T> {
  value: () => string
  children: () => Children<T>
  hidden: () => boolean
  toString: () => string
  getRenderer?: () => Renderer<T>
  data?: T
}

export interface Children<T> {
  at: (index: number) => Node<T> | null
  length: () => number
  forEach: (callback: (node: Node<T>, index: number) => void) => void
  toArray: () => Node<T>[]
}

export type NodeFilter<T> = (node: Node<T>, index: number) => boolean

export class NodeChildren<T = unknown> implements Children<T> {
  constructor(private readonly nodes: Node<T>[] = []) {}

  append(child: Node<T>): NodeChildren<T> {
    return new NodeChildren<T>([...this.nodes, child])
  }

  appendMany(children: Node<T>[]): NodeChildren<T> {
    return new NodeChildren<T>([...this.nodes, ...children])
  }

  remove(index: number): NodeChildren<T> {
    if (index < 0 || index >= this.nodes.length)
      return this
    return new NodeChildren<T>([
      ...this.nodes.slice(0, index),
      ...this.nodes.slice(index + 1),
    ])
  }

  length(): number {
    return this.nodes.length
  }

  at(index: number): Node<T> | null {
    return this.nodes[index] ?? null
  }

  forEach(callback: (node: Node<T>, index: number) => void): void {
    this.nodes.forEach(callback)
  }

  toArray(): Node<T>[] {
    return [...this.nodes]
  }

  filter(filter: NodeFilter<T>): Filter<T> {
    return new Filter<T>(this, [filter])
  }

  map<R>(mapper: (node: Node<T>, index: number) => Node<R>): NodeChildren<R> {
    return new NodeChildren<R>(
      this.nodes.map((node, index) => mapper(node, index)),
    )
  }
}

export class Filter<T = unknown> implements Children<T> {
  private filtered: Node<T>[] = []

  constructor(
    private readonly data: Children<T>,
    private readonly filters: NodeFilter<T>[] = [],
  ) {
    this.updateCache()
  }

  private updateCache(): void {
    this.filtered = []
    this.data.forEach((node, i) => {
      if (this.filters.every(f => f(node, i))) {
        this.filtered.push(node)
      }
    })
  }

  addFilter(fn: NodeFilter<T>): Filter<T> {
    return new Filter<T>(this.data, [...this.filters, fn])
  }

  at(index: number): Node<T> | null {
    return this.filtered[index] ?? null
  }

  length(): number {
    return this.filtered.length
  }

  forEach(callback: (node: Node<T>, index: number) => void): void {
    this.filtered.forEach(callback)
  }

  toArray(): Node<T>[] {
    return [...this.filtered]
  }
}

export class Leaf<T = unknown> implements Node<T> {
  constructor(
    private readonly valueStr: string,
    private readonly isHidden: boolean = false,
    public readonly data?: T,
  ) {}

  value(): string { return this.valueStr }
  children(): Children<T> { return new NodeChildren<T>() }
  hidden(): boolean { return this.isHidden }
  toString(): string { return this.value() }
}
