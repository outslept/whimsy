import process from 'node:process';
import os from 'node:os';

/**
 * Color support levels:
 * 0 - No color
 * 1 - Basic 16 colors
 * 2 - 256 colors (xterm)
 * 3 - Truecolor (16M colors)
 */
type ColorLevel = 0 | 1 | 2 | 3;

/** Active color profile for rendering */
type ColorProfile = 'ansi' | 'ansi256' | 'truecolor';

/** Terminal color capabilities detection result */
interface ColorSupport {
    level: ColorLevel;
    hasBasic: boolean;   // 16-color support
    has256: boolean;     // 256-color support
    has16m: boolean;     // Truecolor support
}

/** Base interface for all color implementations */
interface TerminalColor {
    /** Returns escape sequence for current renderer profile */
    color(renderer: Renderer): string;
    
    /** Returns RGBA values (alpha channel unused, 0xFFFF = opaque) */
    RGBA(): [number, number, number, number];
}

/** Checks for presence of CLI flag with proper syntax handling */
const hasFlag = (flag: string): boolean => {
    const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
    const argv = process.argv;
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf('--');
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};

/** Parses FORCE_COLOR environment variable with legacy support */
const envForceColor = (): ColorLevel | undefined => {
    const forceColor = process.env.FORCE_COLOR;
    if (!forceColor) return undefined;

    // Handle legacy values
    if (forceColor === 'true') return 1;
    if (forceColor === 'false') return 0;
    if (forceColor === '') return 1;

    const level = Math.min(parseInt(forceColor, 10), 3) as ColorLevel;
    return [0, 1, 2, 3].includes(level) ? level : undefined;
};

/** Converts numeric level to feature flags object */
const translateLevel = (level: number): ColorSupport => ({
    level: Math.min(level, 3) as ColorLevel,
    hasBasic: level >= 1,   // Basic colors available from level 1
    has256: level >= 2,     // 256 colors from level 2
    has16m: level >= 3      // Truecolor from level 3
});

/** Core color support detection algorithm */
const _supportsColor = (
    haveStream: boolean,
    options: { streamIsTTY?: boolean; sniffFlags?: boolean } = {}
): ColorLevel => {
    // Detection priority:
    // 1. CLI flags
    // 2. FORCE_COLOR env var
    // 3. Terminal capability autodetection
    
    let flagForceColor: ColorLevel | undefined;
    const envForceColorValue = envForceColor();

    // Parse color-related flags
    if (options.sniffFlags) {
        if (hasFlag('no-color') || hasFlag('color=false') || hasFlag('color=never')) {
            flagForceColor = 0;
        } else if (hasFlag('color') || hasFlag('colors') || hasFlag('color=true') || hasFlag('color=always')) {
            flagForceColor = 1;
        }
    }

    const forceColor = flagForceColor ?? envForceColorValue;
    if (forceColor === 0) return 0;

    // Handle extended color mode flags
    if (options.sniffFlags) {
        if (hasFlag('color=16m') || hasFlag('color=full') || hasFlag('color=truecolor')) return 3;
        if (hasFlag('color=256')) return 2;
    }

    // Non-TTY streams without force color get no colors
    if (haveStream && !options.streamIsTTY && forceColor === undefined) return 0;
    
    // Special case for dumb terminals
    if (process.env.TERM === 'dumb') return Math.max(forceColor ?? 0, 0) as ColorLevel;

    // Windows version detection
    if (process.platform === 'win32') {
        const osRelease = os.release().split('.');
        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
            return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
    }

    // CI environment detection
    if (process.env.CI) {
        // GitHub Actions and GitLab CI support Truecolor
        if (['GITHUB_ACTIONS', 'GITLAB_CI'].some(s => s in process.env)) return 3;
        return 1;
    }

    // Terminal-specific Truecolor checks
    if (process.env.COLORTERM === 'truecolor') return 3;
    if (process.env.TERM === 'xterm-kitty') return 3;

    // Popular terminal emulator detection
    if (process.env.TERM_PROGRAM) {
        const version = parseInt((process.env.TERM_PROGRAM_VERSION || '0').split('.')[0], 10);
        switch (process.env.TERM_PROGRAM) {
            case 'iTerm.app': return version >= 3 ? 3 : 2;  // iTerm3+ supports Truecolor
            case 'Apple_Terminal': return 2;  // macOS default terminal
        }
    }

    // General TERM variable patterns
    if (/-256(color)?$/i.test(process.env.TERM || '')) return 2;
    if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(process.env.TERM || '')) return 1;
    if ('COLORTERM' in process.env) return 1;

    return Math.max(forceColor ?? 0, 0) as ColorLevel;
};

/** Null color object for disabled output */
class NoColor implements TerminalColor {
    color() { return ''; }
    RGBA(): [number, number, number, number] { return [0, 0, 0, 0xFFFF]; }
}

/** HEX color with automatic profile conversion */
class HexColor implements TerminalColor {
    constructor(private value: string) {}
    
    color(renderer: Renderer) { 
        return this.value.startsWith('#') 
            ? hexToAnsi(this.value, renderer.colorProfile)  // Convert to target profile
            : this.value;  // Assume pre-formatted ANSI
    }
    
    RGBA(): [number, number, number, number] {
        return hexToRGBA(this.value);
    }
}

/** Direct ANSI code color */
class ANSIColor implements TerminalColor {
    constructor(private code: number) {}  // Store raw ANSI code
    
    color() { return `${this.code}`; }
    
    RGBA(): [number, number, number, number] {
        return ansiToRGBA(this.code);
    }
}

/** Theme-aware color with light/dark variants */
class AdaptiveColor implements TerminalColor {
    constructor(
        public Light: string,  // HEX for light theme
        public Dark: string    // HEX for dark theme
    ) {}

    color(renderer: Renderer) {
        const colorValue = renderer.hasDarkBackground ? this.Dark : this.Light;
        return new HexColor(colorValue).color(renderer);
    }

    RGBA(): [number, number, number, number] {
        return hexToRGBA(this.Light);  // Use light variant as canonical
    }
}

/** Universal color with all profile variants */
class CompleteColor implements TerminalColor {
    constructor(
        public TrueColor: string,  // HEX or truecolor code
        public ANSI256: string,    // 256-color index
        public ANSI: string        // 16-color code
    ) {}

    color(renderer: Renderer) {
        // Select implementation based on terminal capabilities
        switch (renderer.colorProfile) {
            case 'truecolor': return this.TrueColor;
            case 'ansi256': return this.ANSI256;
            default: return this.ANSI;
        }
    }

    RGBA(): [number, number, number, number] {
        return hexToRGBA(this.TrueColor);
    }
}

/** Theme-aware CompleteColor variant */
class CompleteAdaptiveColor implements TerminalColor {
    constructor(
        public Light: CompleteColor,  // Light theme implementation
        public Dark: CompleteColor    // Dark theme implementation
    ) {}

    color(renderer: Renderer) {
        return renderer.hasDarkBackground
            ? this.Dark.color(renderer)
            : this.Light.color(renderer);
    }

    RGBA(): [number, number, number, number] {
        return this.Light.RGBA();  // Use light variant as canonical
    }
}

/** Central color rendering controller */
class Renderer {
    static default = new Renderer();  // Default singleton instance
    
    private _colorSupport: ColorSupport;
    private _isDarkBackground: boolean;

    constructor(stream?: NodeJS.WriteStream) {
        this._colorSupport = this.detectColorSupport(stream);
        this._isDarkBackground = this.detectDarkBackground();
    }

    /** Current active color profile */
    get colorProfile(): ColorProfile {
        return this._colorSupport.has16m ? 'truecolor' :
               this._colorSupport.has256 ? 'ansi256' : 'ansi';
    }

    /** Dark background detection flag */
    get hasDarkBackground(): boolean {
        return this._isDarkBackground;
    }

    /** Detect terminal color capabilities */
    private detectColorSupport(stream?: NodeJS.WriteStream): ColorSupport {
        const level = _supportsColor(!!stream, {
            streamIsTTY: stream?.isTTY,
            sniffFlags: true
        });
        return translateLevel(level);
    }

    /** Determine background theme */
    private detectDarkBackground(): boolean {
        // Manual override via environment
        const bg = process.env.BACKGROUND || '';
        if (bg.toLowerCase() === 'dark') return true;
        if (bg.toLowerCase() === 'light') return false;
        
        // Heuristic detection for common terminals
        return this.estimateLuminance() < 128;
    }

    /** Platform-based background luminance estimation */
    private estimateLuminance(): number {
        // Windows defaults to dark theme
        return process.platform === 'win32' ? 30 : 220;
    }

    /** Manual profile override */
    setColorProfile(profile: ColorProfile) {
        this._colorSupport = {
            level: profile === 'truecolor' ? 3 : 2,
            hasBasic: true,
            has256: profile !== 'ansi',
            has16m: profile === 'truecolor'
        };
    }

    /** Manual background theme override */
    setDarkBackground(value: boolean) {
        this._isDarkBackground = value;
    }
}

/** Convert HEX string to RGBA tuple */
const hexToRGBA = (hex: string): [number, number, number, number] => {
    const match = hex.replace('#', '').match(/.{1,2}/g) || [];
    const [r = 0, g = 0, b = 0] = match.map(c => parseInt(c, 16));
    return [r, g, b, 0xFFFF];  // Alpha channel unused
};

/** Convert ANSI code to RGBA values */
const ansiToRGBA = (code: number): [number, number, number, number] => {
    // Standard 16-color palette
    const colors = [
        [0, 0, 0],       [128, 0, 0],     [0, 128, 0], 
        [128, 128, 0],   [0, 0, 128],     [128, 0, 128],
        [0, 128, 128],   [192, 192, 192], [128, 128, 128],
        [255, 0, 0],     [0, 255, 0],     [255, 255, 0],
        [0, 0, 255],     [255, 0, 255],   [0, 255, 255],
        [255, 255, 255]
    ];
    
    if (code < 16 && code >= 0) {
        const [r, g, b] = colors[code];
        return [r, g, b, 0xFFFF];
    }
    return [0, 0, 0, 0xFFFF];
};

/** Core HEX to ANSI converter */
const hexToAnsi = (hex: string, profile: ColorProfile): string => {
  // Validate HEX format
  const hexRegex = /^#?([a-f\d]{3}|[a-f\d]{6})$/i;
  const result = hexRegex.exec(hex);
  if (!result) return '15';  // Fallback to white

  let hexColor = result[1];
  
  // Expand shorthand #RGB to #RRGGBB
  if (hexColor.length === 3) {
      hexColor = hexColor.split('').map(c => c + c).join('');
  }

  // Extract RGB components
  const bigint = parseInt(hexColor, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  // Generate appropriate escape sequence
  if (profile === 'truecolor') {
      return `\x1b[38;2;${r};${g};${b}m`;
  }

  if (profile === 'ansi256') {
      const ansi256 = calculateAnsi256(r, g, b);
      return `\x1b[38;5;${ansi256}m`;
  }

  const ansi16 = calculateAnsi16(r, g, b);
  return `\x1b[${ansi16}m`;
};

/** Calculate 256-color index */
const calculateAnsi256 = (r: number, g: number, b: number): number => {
  // Gray scale detection
  if (r === g && g === b) {
      if (r < 8) return 16;
      if (r > 248) return 231;
      return Math.round(((r - 8) / 247) * 24) + 232;
  }
  
  // RGB color cube
  const ri = Math.round(r / 255 * 5);
  const gi = Math.round(g / 255 * 5);
  const bi = Math.round(b / 255 * 5);
  return 16 + 36 * ri + 6 * gi + bi;
};

/** Find closest 16-color match */
const calculateAnsi16 = (r: number, g: number, b: number): number => {
  const colors = [
      [0, 0, 0],       // 0: black
      [128, 0, 0],     // 1: red
      [0, 128, 0],     // 2: green
      [128, 128, 0],   // 3: yellow
      [0, 0, 128],     // 4: blue
      [128, 0, 128],   // 5: magenta
      [0, 128, 128],   // 6: cyan
      [192, 192, 192], // 7: white (light gray)
      [128, 128, 128], // 8: bright black (dark gray)
      [255, 0, 0],     // 9: bright red
      [0, 255, 0],     // 10: bright green
      [255, 255, 0],   // 11: bright yellow
      [0, 0, 255],     // 12: bright blue
      [255, 0, 255],   // 13: bright magenta
      [0, 255, 255],   // 14: bright cyan
      [255, 255, 255]  // 15: bright white
  ];

  let minDistance = Infinity;
  let index = 15;

  for (let i = 0; i < colors.length; i++) {
      const [cr, cg, cb] = colors[i];
      const distance = Math.sqrt(
          Math.pow(r - cr, 2) + 
          Math.pow(g - cg, 2) + 
          Math.pow(b - cb, 2)
      );

      if (distance < minDistance) {
          minDistance = distance;
          index = i;
      }
  }

  return index > 7 ? 90 + (index - 8) : 30 + index;
};

export const Colors = {
    WhiteBright: new AdaptiveColor("#FFFDF5", "#FFFDF5"),
    Normal: new AdaptiveColor("#1A1A1A", "#dddddd"),
    NormalDim: new AdaptiveColor("#A49FA5", "#777777"),
    Gray: new AdaptiveColor("#909090", "#626262"),
    GrayMid: new AdaptiveColor("#B2B2B2", "#4A4A4A"),
    GrayDark: new AdaptiveColor("#DDDADA", "#222222"),
    GrayBright: new AdaptiveColor("#847A85", "#979797"),
    GrayBrightDim: new AdaptiveColor("#C2B8C2", "#4D4D4D"),
    Indigo: new AdaptiveColor("#5A56E0", "#7571F9"),
    IndigoDim: new AdaptiveColor("#9498FF", "#494690"),
    IndigoSubtle: new AdaptiveColor("#7D79F6", "#514DC1"),
    IndigoSubtleDim: new AdaptiveColor("#BBBDFF", "#383584"),
    YellowGreen: new AdaptiveColor("#04B575", "#ECFD65"),
    YellowGreenDull: new AdaptiveColor("#6BCB94", "#9BA92F"),
    Fuschia: new AdaptiveColor("#EE6FF8", "#EE6FF8"),
    FuchsiaDim: new AdaptiveColor("#F1A8FF", "#99519E"),
    FuchsiaDull: new AdaptiveColor("#F793FF", "#AD58B4"),
    FuchsiaDullDim: new AdaptiveColor("#F6C9FF", "#6B3A6F"),
    Green: new HexColor("#04B575"),
    GreenDim: new AdaptiveColor("#72D2B0", "#0B5137"),
    Red: new AdaptiveColor("#FF4672", "#ED567A"),
    RedDull: new AdaptiveColor("#FF6F91", "#C74665")
};

export type { TerminalColor, AdaptiveColor, CompleteColor, CompleteAdaptiveColor };
export { Renderer, HexColor, ANSIColor };
