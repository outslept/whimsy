import c, { type Ansis } from 'ansis';

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export type CursorMode = 'blink' | 'static' | 'hide';

export interface CursorOptions {
  blinkSpeed?: number;
  char?: string;
  style?: Ansis;
  textStyle?: Ansis;
  mode?: CursorMode;
  onUpdate?: () => void;
}

class BlinkController {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;

  async start(ms: number, callback: () => void): Promise<void> {
    this.cancel();

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const loop = async () => {
      try {
        await sleep(ms);
        if (!signal.aborted) {
          callback();
          this.timeoutId = setTimeout(() => loop(), 0);
        }
      } catch (error: any) {
        console.error("Unexpected error in blink loop:", error);
      }
    };

     if (!signal.aborted) {
        this.timeoutId = setTimeout(() => loop(), 0);
     }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isActive(): boolean {
    return this.abortController !== null && !this.abortController.signal.aborted;
  }
}


export class Cursor {
  private blinkSpeed: number;
  private char: string;
  private style: Ansis;
  private textStyle: Ansis;
  private mode: CursorMode;
  private _isFocused: boolean = false;
  private isBlinkingOff: boolean = false;
  private onUpdate?: () => void;

  private readonly blinkController = new BlinkController();

  constructor(options?: CursorOptions) {
    this.blinkSpeed = options?.blinkSpeed ?? 530;
    this.char = options?.char ?? ' ';
    this.style = options?.style ?? c.reset.inverse;
    this.textStyle = options?.textStyle ?? c.reset;
    this.mode = options?.mode ?? 'blink';
    this.onUpdate = options?.onUpdate;
  }

  setMode(mode: CursorMode): void {
    if (mode === this.mode) return;
    if (mode === 'blink' || mode === 'static' || mode === 'hide') {
       this.mode = mode;
       this._updateBlinkState();
    }
  }

  getMode(): CursorMode {
    return this.mode;
  }

  setFocus(focused: boolean): void {
    if (focused === this._isFocused) return;
    this._isFocused = focused;
    this._updateBlinkState();
  }

  isFocused(): boolean {
    return this._isFocused;
  }

  setStyle(style: Ansis): void {
    this.style = style;
  }

  setTextStyle(style: Ansis): void {
    this.textStyle = style;
  }

  setChar(char: string): void {
    this.char = char.length > 0 ? char.slice(0, 1) : ' ';
  }

  setBlinkSpeed(ms: number): void {
    if (ms > 0) {
      this.blinkSpeed = ms;
      if (this.blinkController.isActive()) {
        this._startBlinking();
      }
    }
  }

  getOptions(): Required<CursorOptions> {
    return {
      blinkSpeed: this.blinkSpeed,
      char: this.char,
      style: this.style,
      textStyle: this.textStyle,
      mode: this.mode,
      onUpdate: this.onUpdate ?? (() => {}),
    } as Required<CursorOptions>;
  }

  view(): string {
    switch (this.mode) {
      case 'hide':
        return '';
      case 'static':
        return this.style(this.char);
      case 'blink':
        if (!this._isFocused) {
          return this.textStyle(this.char);
        }
        if (this.isBlinkingOff) {
          return this.textStyle(this.char);
        } else {
          return this.style(this.char);
        }
      default:
        return '';
    }
  }

  reset(): void {
    this._stopBlinking();
  }

  private _updateBlinkState(): void {
    if (this.mode === 'blink' && this._isFocused) {
      this._startBlinking();
    } else {
      this._stopBlinking();
    }
  }

  private _startBlinking(): void {
    this.blinkController.cancel();
    this.isBlinkingOff = false;

    this.blinkController.start(this.blinkSpeed, () => {
      if(this.blinkController.isActive()) {
         this.isBlinkingOff = !this.isBlinkingOff;
         this.onUpdate?.();
      }
    }).catch(error => {
        console.error("Error starting blink controller:", error);
    });
  }

  private _stopBlinking(): void {
    this.blinkController.cancel();
    this.isBlinkingOff = false;
  }
}
