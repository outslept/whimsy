import { Children, Node, NodeChildren, Leaf } from "./children";
import { DefaultEnumerator, DefaultIndenter, Enumerator, Indenter } from "./enumerator";

type StyleFunc = (children: Children, index: number) => string;

class Renderer {
    private enumerator: Enumerator;
    private indenter: Indenter;
    private itemStyle: StyleFunc = () => "";
    private enumStyle: StyleFunc = () => "";
    private rootStyle: string = "";

    constructor() {
        this.enumerator = DefaultEnumerator;
        this.indenter = DefaultIndenter;
    }

    setEnumerator(fn: Enumerator): this {
        this.enumerator = fn;
        return this;
    }

    setIndenter(fn: Indenter): this {
        this.indenter = fn;
        return this;
    }

    setItemStyle(fn: StyleFunc): this {
        this.itemStyle = fn;
        return this;
    }

    setEnumStyle(fn: StyleFunc): this {
        this.enumStyle = fn;
        return this;
    }

    setRootStyle(style: string): this {
        this.rootStyle = style;
        return this;
    }

    render(node: Node, isRoot: boolean, prefix: string): string {
        if (node.hidden()) return "";
        const result: string[] = [];
        const children = node.children();
        
        if (isRoot && node.value()) {
            result.push(this.rootStyle + node.value());
        }

        const prefixes: string[] = [];
        for (let i = 0; i < children.length(); i++) {
            const enumStr = this.enumerator(children, i);
            prefixes.push(this.enumStyle(children, i) + enumStr);
        }

        const maxPrefixLen = Math.max(...prefixes.map(p => p.length), 0);

        for (let i = 0; i < children.length(); i++) {
            const child = children.at(i);
            if (!child || child.hidden()) continue;

            const indent = this.indenter(children, i);
            let nodePrefix = this.enumStyle(children, i) + this.enumerator(children, i);
            nodePrefix = nodePrefix.padStart(maxPrefixLen, " ");
            
            const item = this.itemStyle(children, i) + child.value();
            const line = prefix + nodePrefix + item;
            result.push(line);

            const childRenderer = child instanceof Tree ? child.getRenderer() : this;
            const childOutput = childRenderer.render(
                child,
                false,
                prefix + this.enumStyle(children, i) + indent
            );
            
            if (childOutput) result.push(childOutput);
        }

        return result.join("\n");
    }
}

export class Tree implements Node {
    private valueStr: string = "";
    private isHidden: boolean = false;
    private childrenData: Children = new NodeChildren();
    private renderer: Renderer = new Renderer();

    value(): string { return this.valueStr; }
    children(): Children { return this.childrenData; }
    hidden(): boolean { return this.isHidden; }
    
    hide(hide: boolean): this {
        this.isHidden = hide;
        return this;
    }

    root(value: any): this {
        if (value instanceof Tree) {
            this.valueStr = value.value();
            this.childrenData = value.children();
        } else {
            this.valueStr = String(value);
        }
        return this;
    }

    child(...items: any[]): this {
        for (const item of items) {
            if (item instanceof Tree) {
                this.childrenData = (this.childrenData as NodeChildren).append(item);
            } else if (typeof item === "string") {
                this.childrenData = (this.childrenData as NodeChildren).append(new Leaf(item));
            } else if (Array.isArray(item)) {
                this.child(...item);
            } else if (item instanceof NodeChildren) {
                (item as NodeChildren).at(0)?.children().length();
            }
        }
        return this;
    }

    getRenderer(): Renderer {
        return this.renderer;
    }

    enumerator(fn: Enumerator): this {
        this.renderer.setEnumerator(fn);
        return this;
    }

    indenter(fn: Indenter): this {
        this.renderer.setIndenter(fn);
        return this;
    }

    itemStyle(fn: StyleFunc): this {
        this.renderer.setItemStyle(fn);
        return this;
    }

    enumStyle(fn: StyleFunc): this {
        this.renderer.setEnumStyle(fn);
        return this;
    }

    rootStyle(style: string): this {
        this.renderer.setRootStyle(style);
        return this;
    }

    toString(): string {
        return this.renderer.render(this, true, "");
    }
}

export function NewTree(): Tree {
    return new Tree();
}
