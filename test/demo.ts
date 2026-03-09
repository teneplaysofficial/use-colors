import { EOL } from 'node:os';
import colors from '../lib';

console.log(
  colors.bold('Modifiers:'),
  colors.bold('bold'),
  colors.dim('dim'),
  colors.italic('italic'),
  colors.underline('underline'),
  colors.inverse('inverse'),
  colors.hidden('hidden'),
  colors.strikethrough('strikethrough'),

  EOL,

  colors.bold('Colors:'),
  colors.black('black'),
  colors.red('red'),
  colors.green('green'),
  colors.yellow('yellow'),
  colors.blue('blue'),
  colors.magenta('magenta'),
  colors.cyan('cyan'),
  colors.white('white'),
  colors.gray('gray'),

  colors.redBright('redBright'),
  colors.greenBright('greenBright'),
  colors.yellowBright('yellowBright'),
  colors.blueBright('blueBright'),
  colors.magentaBright('magentaBright'),
  colors.cyanBright('cyanBright'),
  colors.whiteBright('whiteBright'),

  EOL,

  colors.bgBlack.white('bgBlack'),
  colors.bgRed.white('bgRed'),
  colors.bgGreen.black('bgGreen'),
  colors.bgYellow.black('bgYellow'),
  colors.bgBlue.white('bgBlue'),
  colors.bgMagenta.white('bgMagenta'),
  colors.bgCyan.black('bgCyan'),
  colors.bgWhite.black('bgWhite'),

  colors.bgBlackBright.white('bgBlackBright'),
  colors.bgRedBright.black('bgRedBright'),
  colors.bgGreenBright.black('bgGreenBright'),
  colors.bgYellowBright.black('bgYellowBright'),
  colors.bgBlueBright.black('bgBlueBright'),
  colors.bgMagentaBright.black('bgMagentaBright'),
  colors.bgCyanBright.black('bgCyanBright'),
  colors.bgWhiteBright.black('bgWhiteBright'),
);
