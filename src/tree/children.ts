export interface Node {
  value(): string;
  children(): Children;
  hidden(): boolean;
  toString(): string;
}

export interface Children {
  at(index: number): Node | null;
  length(): number;
}

export class NodeChildren implements Children {
  constructor(private nodes: Node[] = []) {}

  append(child: Node): NodeChildren {
      return new NodeChildren([...this.nodes, child]);
  }

  remove(index: number): NodeChildren {
      if (index < 0 || index >= this.nodes.length) return this;
      return new NodeChildren([
          ...this.nodes.slice(0, index),
          ...this.nodes.slice(index + 1)
      ]);
  }

  length(): number {
      return this.nodes.length;
  }

  at(index: number): Node | null {
      return this.nodes[index] ?? null;
  }
}

export class Filter implements Children {
  constructor(
      private data: Children,
      private filterFunc: (index: number) => boolean = () => true
  ) {}

  filter(fn: (index: number) => boolean): Filter {
      return new Filter(this.data, fn);
  }

  length(): number {
      let count = 0;
      for (let i = 0; i < this.data.length(); i++) {
          if (this.filterFunc(i)) count++;
      }
      return count;
  }

  at(index: number): Node | null {
      let count = 0;
      for (let i = 0; i < this.data.length(); i++) {
          if (this.filterFunc(i)) {
              if (count === index) return this.data.at(i);
              count++;
          }
      }
      return null;
  }
}

export class Leaf implements Node {
  constructor(
      private valueStr: string,
      private isHidden: boolean = false
  ) {}

  value(): string { return this.valueStr; }
  children(): Children { return new NodeChildren(); }
  hidden(): boolean { return this.isHidden; }
  toString(): string { return this.value(); }
}

export function newStringData(...data: string[]): Children {
  return new NodeChildren(data.map(s => new Leaf(s)));
}
