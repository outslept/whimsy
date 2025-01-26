import type { Children } from "./children";

export type Enumerator = (children: Children, index: number) => string;
export type Indenter = (children: Children, index: number) => string;

export const DefaultEnumerator: Enumerator = (children, index) => {
    return children.length() - 1 === index ? "└──" : "├──";
};

export const RoundedEnumerator: Enumerator = (children, index) => {
    return children.length() - 1 === index ? "╰──" : "├──";
};

export const DefaultIndenter: Indenter = (children, index) => {
    return children.length() - 1 === index ? "   " : "│  ";
};
