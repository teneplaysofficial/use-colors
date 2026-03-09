import type { COLOR_LEVEL } from './constants/level';
import type { STYLES } from './constants/styles';

/**
 * Supported terminal color levels.
 */
export type ColorLevel = (typeof COLOR_LEVEL)[keyof typeof COLOR_LEVEL];

/**
 * All supported style keys.
 */
export type StyleKeys = keyof typeof STYLES;

/**
 * Style definition value.
 *
 * Usually a tuple of ANSI open/close codes.
 */
export type StyleValue = (typeof STYLES)[StyleKeys];

/**
 * Configuration options for the color instance.
 */
export type Options = {
  /**
   * Terminal color support level.
   *
   * Controls which color formats are emitted.
   *
   * @default 3
   */
  level?: ColorLevel;
};

/**
 * Numeric range helper.
 */
type Range<N extends number, A extends unknown[] = []> = A['length'] extends N
  ? A[number]
  : Range<N, [...A, A['length']]>;

/**
 * Unsigned 8-bit integer.
 *
 * Range: `0–255`.
 * Used for RGB channels and ANSI256 color indexes.
 */
export type Byte = Range<256>;

/**
 * Main color function type.
 *
 * This function applies styles to text and supports chained styling:
 *
 * ```ts
 * colors.red.bold("Hello")
 * ```
 */
export type ColorFn =
  /**
   * Apply the current style chain to text.
   */
  ((...text: unknown[]) => string) &
    /**
     * Chainable style modifiers.
     *
     * Example:
     * ```ts
     * colors.red.bold.underline("text")
     * ```
     */
    { [K in StyleKeys]: ColorFn } & {
    /**
     * Apply an RGB color depending on terminal support level.
     *
     * ```ts
     * colors.rgb(255,0,0)("text")
     * ```
     */
    rgb: (r: Byte, g: Byte, b: Byte) => (text: string) => string;

    /**
     * Apply a HEX color.
     *
     * ```ts
     * colors.hex("#ff0000")("text")
     * ```
     */
    hex: (hex: string) => (text: string) => string;

    /**
     * Apply ANSI-256 color.
     *
     * Valid range: `0–255`.
     *
     * ```ts
     * colors.ansi256(196)("text")
     * ```
     */
    ansi256: (n: Byte) => (text: string) => string;

    /**
     * Remove ANSI escape sequences from text.
     *
     * ```ts
     * colors.strip("\x1b[31mtext\x1b[0m")
     * ```
     */
    strip: (text: string) => string;

    /**
     * Check if a string contains ANSI escape codes.
     */
    hasAnsi: (s: string) => boolean;

    /**
     * Configure runtime options for the color instance.
     *
     * ```ts
     * colors.config({ level: 3 })
     * ```
     */
    config: ((options?: Options) => void) & Options;
  };
