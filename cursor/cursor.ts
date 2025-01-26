type TeaMsg = 
    | { type: 'initialBlink' }
    | { type: 'blink', id: number, tag: number }
    | { type: 'blinkCanceled' }
    | { type: 'focus' }
    | { type: 'blur' };

enum CursorMode {
    Blink,
    Static,
    Hide
}

class TerminalStyle {
    private styles: string[] = [];
    private isInline = false;

    clone(): TerminalStyle {
        const newStyle = new TerminalStyle();
        newStyle.styles = [...this.styles];
        newStyle.isInline = this.isInline;
        return newStyle;
    }

    reverse(v: boolean): TerminalStyle {
        const style = this.clone();
        if(v) style.styles.push('\x1b[7m');
        return style;
    }

    inline(v: boolean): TerminalStyle {
        const style = this.clone();
        style.isInline = v;
        return style;
    }

    render(text: string): string {
        const reset = this.isInline ? '' : '\x1b[0m';
        return `${this.styles.join('')}${text}${reset}`;
    }
}

class BlinkContext {
    private timeoutId: number | null = null;
    
    start(ms: number, callback: () => void): () => void {
        this.cancel();
        this.timeoutId = setTimeout(() => {
            callback();
            this.timeoutId = null;
        }, ms) as unknown as number;
        return this.cancel.bind(this);
    }

    cancel() {
        if(this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}

class CursorModel {
    blinkSpeed: number = 530;
    style: TerminalStyle = new TerminalStyle();
    textStyle: TerminalStyle = new TerminalStyle();
    char: string = ' ';
    id: number = 0;
    focus: boolean = false;
    blink: boolean = true;
    mode: CursorMode = CursorMode.Blink;
    
    private blinkContext = new BlinkContext();
    private blinkTag: number = 0;

    update(msg: TeaMsg): [CursorModel, (() => Promise<TeaMsg>) | null] {
        switch (msg.type) {
            case 'initialBlink':
                if (!this.shouldBlink()) return [this, null];
                return [this, this.blinkCommand()];
            
            case 'focus':
                return [this, this.handleFocus()];
            
            case 'blur':
                this.handleBlur();
                return [this, null];
            
            case 'blink':
                if (!this.validateBlink(msg)) return [this, null];
                
                this.blink = !this.blink;
                return [this, this.blinkCommand()];
            
            default:
                return [this, null];
        }
    }

    private shouldBlink(): boolean {
        return this.mode === CursorMode.Blink && this.focus;
    }

    private validateBlink(msg: { id: number; tag: number }): boolean {
        return this.shouldBlink() && 
               msg.id === this.id && 
               msg.tag === this.blinkTag;
    }

    private handleFocus(): (() => Promise<TeaMsg>) | null {
        this.focus = true;
        this.blink = this.mode === CursorMode.Hide;

        if (this.shouldBlink()) {
            return this.blinkCommand();
        }
        return null;
    }

    private handleBlur() {
        this.focus = false;
        this.blink = true;
        this.blinkContext.cancel();
    }

    private blinkCommand(): (() => Promise<TeaMsg>) | null {
        if (!this.shouldBlink()) return null;

        this.blinkContext.cancel();
        this.blinkTag++;

        const currentTag = this.blinkTag;
        const currentId = this.id;

        return () => new Promise(resolve => {
            const cleanup = this.blinkContext.start(this.blinkSpeed, () => {
                resolve({ type: 'blink', id: currentId, tag: currentTag });
            });
        });
    }

    setMode(mode: CursorMode): void {
        if (mode < CursorMode.Blink || mode > CursorMode.Hide) return;
        this.mode = mode;
        this.blink = this.mode === CursorMode.Hide || !this.focus;
    }

    view(): string {
        if (this.blink) {
            return this.textStyle
                .inline(true)
                .render(this.char);
        }
        
        return this.style
            .inline(true)
            .reverse(true)
            .render(this.char);
    }
}
