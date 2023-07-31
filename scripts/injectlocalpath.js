const readline = require('readline');

const COLOR = {
  bgRed: '\x1b[41m',
  fgWhite: '\x1b[37m',
  fgRed: '\x1b[31m',
  fgYellow: '\x1b[33m',
  fgBlue: '\x1b[34m',
  fgGreen: '\x1b[32m',
  fgMagenta: '\x1b[35m',
  fgCyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
};

const SUPPORTED_TESTS = ['e2e', 'unit'];

/**
 * @type {"e2e" | "unit"}
 */
const testType = process.argv[2];

if (!SUPPORTED_TESTS.includes(testType))
  throw new Error(
    `${COLOR.fgRed}Test type not supported, arg "${COLOR.bright}${testType}${
      COLOR.reset
    }${COLOR.fgRed}" should be any of: ${SUPPORTED_TESTS.map(
      (test) => `"${test}"`,
    ).join(', ')}${COLOR.reset}`,
  );

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.question(
  `${COLOR.fgYellow}Paste the ${COLOR.bright}absolute path${COLOR.reset}${COLOR.fgYellow} from your local machine to access an .eml file (leave empty for default): ${COLOR.reset}`,
  (localEmlPath) => {
    process.env.LOCAL_EML_PATH = localEmlPath;
    require('child_process').spawnSync(
      'jest',
      [
        testType === 'e2e' ? '--config=./test/jest-e2e.json' : '',
        ...process.argv.slice(3),
      ],
      {
        stdio: 'inherit',
      },
    );
    rl.close();
  },
);
