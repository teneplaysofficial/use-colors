import { env, hasEnv } from 'js-utils-kit';
import { COLOR_LEVEL } from './constants/level';
import { STYLES } from './constants/styles';
import type { Byte, ColorFn, ColorLevel, Options, StyleKeys, StyleValue } from './types';

const ESC = '\x1b[';

const ctx = {
  level: detectColorLevel(),
};

/** Convert a style tuple to ANSI escape sequences. */
function ansi([open, close]: StyleValue) {
  return {
    open: `${ESC}${open}m`,
    close: `${ESC}${close}m`,
  };
}

/** Apply a named ANSI style to text. */
function style(name: StyleKeys, text: string) {
  if (ctx.level === COLOR_LEVEL.NONE) return text;

  const s = ansi(STYLES[name]);

  return s.open + text + s.close;
}

function rgb(r: Byte, g: Byte, b: Byte, text: string) {
  if (ctx.level === COLOR_LEVEL.NONE) return text;

  if (ctx.level === COLOR_LEVEL.TRUECOLOR) return `${ESC}38;2;${r};${g};${b}m${text}${ESC}39m`;

  if (ctx.level === COLOR_LEVEL.ANSI256) {
    const n = rgbToAnsi256(r, g, b);
    return `${ESC}38;5;${n}m${text}${ESC}39m`;
  }

  return text;
}

function hex(hex: string, text: string) {
  const { r, g, b } = hexToRgb(hex);
  return rgb(r, g, b, text);
}

function ansi256(n: Byte, text: string) {
  if (ctx.level === COLOR_LEVEL.NONE) return text;
  return `${ESC}38;5;${n}m${text}${ESC}39m`;
}

function strip(text: string) {
  return text.replace(new RegExp(`${ESC.replace('[', '\\[')}[0-9;]*m`, 'g'), '');
}

/** Convert RGB to ANSI256 color index. */
function rgbToAnsi256(r: number, g: number, b: number) {
  const rr = Math.round((r / 255) * 5);
  const gg = Math.round((g / 255) * 5);
  const bb = Math.round((b / 255) * 5);

  return 16 + 36 * rr + 6 * gg + bb;
}

/** Convert HEX color to RGB components. */
function hexToRgb(hex: string): { r: Byte; g: Byte; b: Byte } {
  hex = hex.replace('#', '');

  if (hex.length === 3)
    hex = hex
      .split('')
      .map((x) => x + x)
      .join('');

  const num = parseInt(hex, 16);

  return {
    r: ((num >> 16) & 255) as Byte,
    g: ((num >> 8) & 255) as Byte,
    b: (num & 255) as Byte,
  };
}

/** Detect terminal color capability level. */
function detectColorLevel() {
  if (hasEnv('NO_COLOR')) return COLOR_LEVEL.NONE;
  if (hasEnv('FORCE_COLOR')) return COLOR_LEVEL.TRUECOLOR;

  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') return COLOR_LEVEL.TRUECOLOR;

  if (env.TERM?.includes('256color')) return COLOR_LEVEL.ANSI256;

  return COLOR_LEVEL.ANSI16;
}

/** Parse template literal input. */
function template(args: unknown[]): string {
  const strings = args[0] as TemplateStringsArray;
  const values = args.slice(1);

  let out = '';

  for (let i = 0; i < strings.length; i++) out += (strings[i] ?? '') + (values[i] ?? '');

  return out;
}

/** Apply stacked styles to text. */
function applyStack(stack: StyleKeys[], text: string) {
  let out = text;

  for (const s of stack) out = style(s, out);

  return out;
}

const config = Object.assign(
  (options: Options = {}) => {
    if (options.level !== undefined) ctx.level = options.level;
  },
  {
    get level() {
      return ctx.level;
    },
    set level(level: ColorLevel) {
      ctx.level = level;
    },
  },
);

const hasAnsi = (s: string) => s.includes(ESC);

/** Build the color proxy chain. */
function build(stack: StyleKeys[] = []): ColorFn {
  const fn = (...args: unknown[]) => {
    const text =
      Array.isArray(args[0]) && 'raw' in (args[0] as object) ? template(args) : args.join(' ');

    return applyStack(stack, text);
  };

  return new Proxy(fn, {
    get(_, prop: string) {
      if (prop in STYLES) return build([...stack, prop as StyleKeys]);

      if (prop === 'config') return config;

      if (prop === 'rgb')
        return (r: Byte, g: Byte, b: Byte) => (text: string) => rgb(r, g, b, text);

      if (prop === 'hex') return (hexColor: string) => (text: string) => hex(hexColor, text);

      if (prop === 'ansi256') return (n: Byte) => (text: string) => ansi256(n, text);

      if (prop === 'strip') return (text: string) => strip(text);

      if (prop === 'hasAnsi') return (text: string) => hasAnsi(text);

      return undefined;
    },
  }) as ColorFn;
}

const optionHandlers: Record<string, (value: unknown) => void> = {};

/** Register built-in option handlers. */
optionHandlers.level = (value) => {
  ctx.level = value as ColorLevel;
};

/** Apply options using registered option handlers. */
function applyOptions(options?: Options) {
  if (!options) return;

  for (const key in options) {
    const handler = optionHandlers[key];

    if (handler) handler((options as Record<string, unknown>)[key]);
  }
}

/**
 * Create a new colors instance.
 *
 * @example
 * ```ts
 * const colors = createColors({ level: 3 })
 *
 * colors.red("Hello")
 * ```
 *
 * @example
 * ```ts
 * const colors = createColors()
 *
 * colors.config({ level: 0 })
 * ```
 */
export function createColors(options?: Options): ColorFn {
  applyOptions(options);
  return build();
}

/**
 * Default global colors instance.
 *
 * @remarks
 * This instance uses automatically detected terminal color support.
 *
 * @example
 * ```ts
 * import colors from "use-colors"
 *
 * console.log(colors.red("Error"))
 * console.log(colors.bold.green("Success"))
 * ```
 */
export const colors: ColorFn = createColors();

export default colors;
