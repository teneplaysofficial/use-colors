import { describe, expect, it, vi } from 'vitest';
import colors, { createColors } from '../lib';
import { COLOR_LEVEL } from '../lib/constants/level';

const ESC = '\x1b[';

describe('basic style application', () => {
  it('applies a single style', () => {
    const c = createColors({ level: COLOR_LEVEL.ANSI16 });
    const out = c.red('hello');
    expect(out).toBe(`${ESC}31mhello${ESC}39m`);
  });

  it('supports chained styles', () => {
    const c = createColors({ level: COLOR_LEVEL.ANSI16 });
    const out = c.red.bold('hello');
    expect(out).toBe(`${ESC}1m${ESC}31mhello${ESC}39m${ESC}22m`);
  });

  it('supports multiple arguments', () => {
    const out = colors.green('hello', 'world');
    expect(out).toContain('hello world');
  });

  it('returns undefined for unknown style properties', () => {
    // @ts-expect-error
    const x = colors.notAStyle;
    expect(x).toBeUndefined();
  });
});

describe('template literal support', () => {
  it('applies styles using template literals', () => {
    const c = createColors({ level: COLOR_LEVEL.ANSI16 });

    const name = 'world';
    const out = c.red`hello ${name}`;

    expect(out).toContain('hello world');
    expect(out).toContain(`${ESC}31m`);
  });

  it('supports multiple interpolations in template literals', () => {
    const out = colors.green`a${1}b${2}`;
    expect(out).toContain('a1b2');
  });

  it('handles template literal parsing path correctly', () => {
    const out = colors.blue`hello ${'A'} world`;
    expect(out).toContain('hello A world');
  });
});

describe('color formats', () => {
  describe('rgb', () => {
    it('applies rgb color formatting', () => {
      const c = createColors({ level: COLOR_LEVEL.TRUECOLOR });

      const out = c.rgb(255, 0, 0)('hello');

      expect(out).toContain('hello');
      expect(out).toContain(`${ESC}38`);
    });

    it('uses TRUECOLOR when level is TRUECOLOR', () => {
      const c = createColors({ level: COLOR_LEVEL.TRUECOLOR });

      const out = c.rgb(1, 2, 3)('x');

      expect(out).toBe(`${ESC}38;2;1;2;3mx${ESC}39m`);
    });

    it('falls back to ANSI256 when level is ANSI256', () => {
      const c = createColors({ level: COLOR_LEVEL.ANSI256 });

      const out = c.rgb(255, 0, 0)('x');

      expect(out).toContain(`${ESC}38;5;`);
    });

    it('returns plain text when level is ANSI16', () => {
      const c = createColors({ level: COLOR_LEVEL.ANSI16 });

      const out = c.rgb(10, 20, 30)('hello');

      expect(out).toBe('hello');
    });
  });

  describe('hex', () => {
    it('applies hex color formatting', () => {
      const c = createColors({ level: COLOR_LEVEL.TRUECOLOR });

      const out = c.hex('#ff0000')('hello');

      expect(out).toContain('hello');
      expect(out).toContain(`${ESC}38`);
    });

    it('supports short hex format', () => {
      const c = createColors({ level: COLOR_LEVEL.TRUECOLOR });

      const out = c.hex('#f00')('hello');

      expect(out).toContain(`${ESC}38`);
    });
  });

  describe('ansi256', () => {
    it('applies ANSI256 color formatting', () => {
      const c = createColors({ level: COLOR_LEVEL.ANSI256 });

      const out = c.ansi256(196)('hello');

      expect(out).toBe(`${ESC}38;5;196mhello${ESC}39m`);
    });
  });
});

describe('ANSI utilities', () => {
  describe('strip', () => {
    it('removes ANSI escape sequences from styled text', () => {
      const c = createColors({ level: COLOR_LEVEL.ANSI16 });

      const colored = c.red('hello');
      const stripped = c.strip(colored);

      expect(stripped).toBe('hello');
    });

    it('removes multiple ANSI sequences', () => {
      const text = '\x1b[31mhello\x1b[39m';
      expect(colors.strip(text)).toBe('hello');
    });
  });

  describe('hasAnsi', () => {
    it('detects ANSI sequences in styled text', () => {
      const c = createColors({ level: COLOR_LEVEL.ANSI16 });

      const colored = c.red('hello');
      expect(c.hasAnsi(colored)).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(colors.hasAnsi('hello')).toBe(false);
    });

    it('detects raw ANSI escape sequences', () => {
      const text = '\x1b[31mhello\x1b[39m';
      expect(colors.hasAnsi(text)).toBe(true);
    });
  });
});

describe('runtime configuration', () => {
  it('updates color level using config', () => {
    const c = createColors();

    c.config({ level: COLOR_LEVEL.NONE });

    expect(c.red('hello')).toBe('hello');
  });

  it('updates color level using config.level property', () => {
    const c = createColors();

    c.config.level = COLOR_LEVEL.NONE;

    expect(c.red('hello')).toBe('hello');
  });
});

describe('instance creation', () => {
  it('respects level option when creating a new instance', () => {
    const c = createColors({ level: COLOR_LEVEL.NONE });

    expect(c.red('hello')).toBe('hello');

    c.config({ level: COLOR_LEVEL.TRUECOLOR });

    const out = c.red('hello');

    expect(out).toContain(`${ESC}31m`);
  });
});

describe('nested styling behavior', () => {
  it('supports nested styled strings', () => {
    const c = createColors({ level: COLOR_LEVEL.ANSI16 });

    const inner = c.green('world');
    const out = c.red(`hello ${inner}`);

    expect(out).toContain('world');
    expect(out).toContain(`${ESC}31m`);
  });
});

describe('environment-based color detection', () => {
  it('disables colors when NO_COLOR is set', async () => {
    process.env.NO_COLOR = '1';

    vi.resetModules();

    const { createColors } = await import('../lib');

    const c = createColors();

    const out = c.red('hello');

    expect(out).toBe('hello');

    delete process.env.NO_COLOR;
  });

  it('detects ANSI256 support from TERM', async () => {
    process.env.TERM = 'xterm-256color';
    delete process.env.COLORTERM;

    vi.resetModules();

    const { createColors } = await import('../lib');

    const c = createColors();

    const out = c.rgb(255, 0, 0)('x');

    expect(out).toContain('\x1b[38;5;');

    delete process.env.TERM;
  });

  it('forces color output when FORCE_COLOR is set', async () => {
    process.env.FORCE_COLOR = '1';

    vi.resetModules();

    const { createColors } = await import('../lib');

    const c = createColors();

    const out = c.red('hello');

    expect(out).toContain(`${ESC}31m`);

    delete process.env.FORCE_COLOR;
  });

  it('falls back to ANSI16 when no environment flags are set', async () => {
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    delete process.env.COLORTERM;
    delete process.env.TERM;

    vi.resetModules();

    const { createColors } = await import('../lib');

    const c = createColors();

    const out = c.rgb(255, 0, 0)('x');

    expect(out).toBe('x');
  });
});
