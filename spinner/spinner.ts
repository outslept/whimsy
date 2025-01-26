import util from 'util';

type SpinnerEvent = 
    | { 
        type: 'frameUpdate';
        timestamp: Date;
        sequenceId: number;
        instanceId: number;
      }
    | { 
        type: 'syncRequest';
        instanceId?: never;
        sequenceId?: never;
        timestamp?: never;
      };

type SpinnerConfig = {
  animationFrames: string[];
  frameDurationMs: number;
};

export const Spinners = {
  /** Classic terminal spinner (|/-\) */
  Line: { 
    animationFrames: ["|", "/", "-", "\\"], 
    frameDurationMs: 100 
  },
  
  /** Smooth dot rotation (⣾ ⣽ ⣻ ...) */
  Dot: { 
    animationFrames: ["⣾ ", "⣽ ", "⣻ ", "⢿ ", "⡿ ", "⣟ ", "⣯ ", "⣷ "], 
    frameDurationMs: 100 
  },
  
  /** Compact dot variant (⠋⠙⠹...) */
  MiniDot: { 
    animationFrames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"], 
    frameDurationMs: 83 
  },
  
  /** Jumping character animation (⢄⢂⢁...) */
  Jump: { 
    animationFrames: ["⢄", "⢂", "⢁", "⡁", "⡈", "⡐", "⡠"], 
    frameDurationMs: 100 
  },
  
  /** Pulsing block effect (█▓▒░) */
  Pulse: { 
    animationFrames: ["█", "▓", "▒", "░"], 
    frameDurationMs: 125 
  },
  
  /** Bullet point progression (∙∙∙●∙∙...) */
  Points: { 
    animationFrames: ["∙∙∙", "●∙∙", "∙●∙", "∙∙●"], 
    frameDurationMs: 142 
  },
  
  /** Rotating globe (🌍🌎🌏) */
  Globe: { 
    animationFrames: ["🌍", "🌎", "🌏"], 
    frameDurationMs: 250 
  },
  
  /** Moon phases (🌑🌒🌓...) */
  Moon: { 
    animationFrames: ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"], 
    frameDurationMs: 125 
  },
  
  /** Monkey covering eyes (🙈🙉🙊) */
  Monkey: { 
    animationFrames: ["🙈", "🙉", "🙊"], 
    frameDurationMs: 333 
  },
  
  /** Progress meter filling (▱▰▰▱) */
  Meter: { 
    animationFrames: ["▱▱▱", "▰▱▱", "▰▰▱", "▰▰▰", "▰▰▱", "▰▱▱", "▱▱▱"],
    frameDurationMs: 142
  },
  
  /** Hamburger menu animation (☱☲☴☲) */
  Hamburger: { 
    animationFrames: ["☱", "☲", "☴", "☲"], 
    frameDurationMs: 333 
  },
  
  /** Text ellipsis expansion ("", ".", "..", "...") */
  Ellipsis: { 
    animationFrames: ["", ".", "..", "..."], 
    frameDurationMs: 333 
  }
};

export class AnsiStyleBuilder {
  private activeCodes: string[] = [];
    
  /** Applies ANSI styles to text with optional cleanup */
  compose(text: string, stripControlChars: boolean = false): string {
    const styled = `${this.activeCodes.join('')}${text}\x1b[0m`;
    return stripControlChars 
      ? util.stripVTControlCharacters(styled) 
      : styled;
  }

  /** Creates new independent style instance */
  duplicate(): AnsiStyleBuilder {
    const clone = new AnsiStyleBuilder();
    clone.activeCodes = [...this.activeCodes];
    return clone;
  }

  /** Sets text color using xterm 256-color codes */
  withForeground(colorCode: number): AnsiStyleBuilder {
    const style = this.duplicate();
    style.activeCodes.push(`\x1b[38;5;${colorCode}m`);
    return style;
  }

  /** Sets background color using xterm 256-color codes */
  withBackground(colorCode: number): AnsiStyleBuilder {
    const style = this.duplicate();
    style.activeCodes.push(`\x1b[48;5;${colorCode}m`);
    return style;
  }
}

/** Internal counter for multi-spinner instance management */
let spinnerInstanceCounter = 0;

export class Spinner {
  private currentFrameIndex = 0;
  private sequenceNumber = 0;
  readonly instanceId: number;

  /** Creates spinner instance */
  constructor(
    public readonly config: SpinnerConfig = Spinners.Line,
    public readonly style: AnsiStyleBuilder = new AnsiStyleBuilder()
  ) {
    this.instanceId = ++spinnerInstanceCounter;
  }

  /** Processes animation events and manages state transitions */
  processEvent(event: SpinnerEvent): [Spinner, (() => Promise<SpinnerEvent>) | null] {
    if (event.type === 'frameUpdate' && this.isValidEvent(event)) {
      this.advanceAnimation();
      return [this, this.scheduleNextFrame()];
    }
    return [this, null];
  }

  /** Renders current animation frame with applied styles */
  getCurrentFrame(stripStyles: boolean = false): string {
    return this.style.compose(
      this.config.animationFrames[this.currentFrameIndex] || '⚠',
      stripStyles
    );
  }

  /** Advances animation to next frame with boundary check */
  private advanceAnimation(): void {
    this.currentFrameIndex = (this.currentFrameIndex + 1) % 
      this.config.animationFrames.length;
    this.sequenceNumber++;
  }

  /** Schedules next animation frame update */
  private scheduleNextFrame(): () => Promise<SpinnerEvent> {
    return () => new Promise(resolve => {
      setTimeout(() => resolve({
        type: 'frameUpdate',
        timestamp: new Date(),
        instanceId: this.instanceId,
        sequenceId: this.sequenceNumber
      }), this.config.frameDurationMs);
    });
  }

  /** Validates event sequence synchronization */
  private isValidEvent(event: SpinnerEvent): boolean {
    return event.instanceId === this.instanceId &&
           event.sequenceId === this.sequenceNumber;
  }
}
