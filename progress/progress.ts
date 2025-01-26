import util from 'util';

type ProgressEvent = 
    | { 
        type: 'progressUpdate';
        progress: number;
        timestamp: Date;
        instanceId: number;
      }
    | { 
        type: 'renderRequest';
        instanceId?: never;
        timestamp?: never;
      };

type ProgressBarConfig = {
  styleType: 'block' | 'smooth' | 'text' | 'legacy';
  barWidth: number;
  fillChar: string;
  emptyChar: string;
  showPercentage?: boolean;
  reverse?: boolean;
};

export const ProgressBars: { 
  [key: string]: ProgressBarConfig 
} = {
  /** Classic block style [####----] */
  Block: {
    styleType: 'block',
    barWidth: 20,
    fillChar: '#',
    emptyChar: '-',
    showPercentage: true
  },
  
  /** Smooth unicode gradient */
  Smooth: {
    styleType: 'smooth',
    barWidth: 25,
    fillChar: '█',
    emptyChar: '░',
    showPercentage: true
  },
  
  /** Retro ASCII style */
  Retro: {
    styleType: 'legacy',
    barWidth: 30,
    fillChar: '≡',
    emptyChar: '·',
    showPercentage: false
  },
  
  /** Text percentage only */
  TextOnly: {
    styleType: 'text',
    barWidth: 0,
    fillChar: '',
    emptyChar: '',
    showPercentage: true
  },
  
  /** Vertical bar meter */
  Vertical: {
    styleType: 'block',
    barWidth: 12,
    fillChar: '▓',
    emptyChar: '▂',
    reverse: true
  },
  
  /** Braille pattern progress */
  Braille: {
    styleType: 'smooth',
    barWidth: 10,
    fillChar: '⣿',
    emptyChar: '⠀',
    showPercentage: true
  }
};

export class AnsiStyleBuilder {
  private activeCodes: string[] = [];
    
  compose(text: string, stripControlChars: boolean = false): string {
    const styled = `${this.activeCodes.join('')}${text}\x1b[0m`;
    return stripControlChars 
      ? util.stripVTControlCharacters(styled) 
      : styled;
  }

  duplicate(): AnsiStyleBuilder {
    const clone = new AnsiStyleBuilder();
    clone.activeCodes = [...this.activeCodes];
    return clone;
  }

  withForeground(colorCode: number): AnsiStyleBuilder {
    const style = this.duplicate();
    style.activeCodes.push(`\x1b[38;5;${colorCode}m`);
    return style;
  }

  withBackground(colorCode: number): AnsiStyleBuilder {
    const style = this.duplicate();
    style.activeCodes.push(`\x1b[48;5;${colorCode}m`);
    return style;
  }

  withBold(): AnsiStyleBuilder {
    const style = this.duplicate();
    style.activeCodes.push('\x1b[1m');
    return style;
  }

  withItalic(): AnsiStyleBuilder {
    const style = this.duplicate();
    style.activeCodes.push('\x1b[3m');
    return style;
  }
}


export class ProgressBar {
  private currentProgress = 0;
  readonly instanceId: number;
  private static instanceCounter = 0;

  constructor(
    public config: ProgressBarConfig = ProgressBars.Block,
    public fillStyle: AnsiStyleBuilder = new AnsiStyleBuilder(),
    public emptyStyle: AnsiStyleBuilder = new AnsiStyleBuilder()
  ) {
    this.instanceId = ++ProgressBar.instanceCounter;
  }

  /** Update progress (0-100) */
  setProgress(progress: number): void {
    this.currentProgress = Math.min(100, Math.max(0, progress));
  }

  /** Generate rendered bar string */
  getBarString(): string {
    const filledWidth = (this.currentProgress / 100) * this.config.barWidth;
    const [filled, empty] = this.calculateSections(filledWidth);
    
    let bar = '';
    
    switch(this.config.styleType) {
      case 'block':
        bar = this.renderBlockStyle(filled, empty);
        break;
      case 'smooth':
        bar = this.renderSmoothStyle(filledWidth);
        break;
      case 'text':
        bar = this.renderTextStyle();
        break;
      case 'legacy':
        bar = this.renderLegacyStyle(filled, empty);
        break;
    }

    return bar;
  }

  private calculateSections(filledWidth: number): [number, number] {
    const filled = Math.floor(filledWidth);
    const empty = this.config.barWidth - filled;
    return this.config.reverse ? [empty, filled] : [filled, empty];
  }

  private renderBlockStyle(filled: number, empty: number): string {
    const filledPart = this.fillStyle.compose(
      this.config.fillChar.repeat(filled)
    );
    const emptyPart = this.emptyStyle.compose(
      this.config.emptyChar.repeat(empty)
    );
    return `[${filledPart}${emptyPart}]` + 
      (this.config.showPercentage ? ` ${Math.round(this.currentProgress)}%` : '');
  }

  private renderSmoothStyle(filledWidth: number): string {
    const fullBlocks = Math.floor(filledWidth);
    const partial = filledWidth % 1;
    const partialChar = this.getPartialChar(partial);
    
    const filled = this.fillStyle.compose(
      this.config.fillChar.repeat(fullBlocks) + partialChar
    );
    const empty = this.emptyStyle.compose(
      this.config.emptyChar.repeat(this.config.barWidth - fullBlocks - (partial > 0 ? 1 : 0))
    );
    
    return `${filled}${empty}` + 
      (this.config.showPercentage ? ` ${Math.round(this.currentProgress)}%` : '');
  }

  private getPartialChar(partial: number): string {
    const partialChars = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉'];
    return partialChars[Math.floor(partial * 8)] || '';
  }

  private renderTextStyle(): string {
    return this.fillStyle.compose(
      `${Math.round(this.currentProgress)}%`
    );
  }

  private renderLegacyStyle(filled: number, empty: number): string {
    return this.fillStyle.compose('>') + 
      this.fillStyle.compose(this.config.fillChar.repeat(filled)) +
      this.emptyStyle.compose(this.config.emptyChar.repeat(empty)) +
      (this.config.showPercentage ? ` ${Math.round(this.currentProgress)}%` : '');
  }
}
