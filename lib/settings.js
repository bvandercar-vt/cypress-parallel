const yargs = require('yargs');

const cypressVersion = require('cypress/package.json').version;
const cypressMajorVersion = parseInt(cypressVersion.split('.')[0], 10);

const argv = yargs
  .parserConfiguration({ 'duplicate-arguments-array': false })
  .option('script', {
    alias: 's',
    type: 'string',
    requiresArg: true,
    description: 'Your npm Cypress command'
  })
  .option('threads', {
    alias: 't',
    type: 'number',
    default: 2,
    description: 'Number of threads'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    default: false,
    description: 'Execute with verbose logging'
  })
  .option('bail', {
    alias: 'b',
    type: 'boolean',
    default: false,
    description: 'Exit on first suite finishing with errors'
  })
  .option('specsDir', {
    alias: 'd',
    type: 'string',
    default: cypressMajorVersion >= 10 ? 'cypress/e2e' : 'cypress/integration',
    description: 'Cypress specs directory'
  })
  .option('spec', {
    type: 'array',
    default: undefined,
    description: 'List of Cypress spec paths'
  })
  .option('args', {
    alias: 'a',
    type: 'string',
    description: 'Your npm Cypress command arguments'
  })
  .option('reporter', {
    alias: 'r',
    type: 'string',
    description: 'Reporter to pass to Cypress'
  })
  .option('reporterModulePath', {
    alias: 'n',
    type: 'string',
    default: 'cypress-multi-reporters',
    description: 'Reporter module path'
  })
  .option('reporterOptions', {
    alias: 'o',
    type: 'string',
    description: 'Reporter options'
  })
  .option('reporterOptionsPath', {
    alias: 'p',
    type: 'string',
    description: 'Reporter options path'
  })
  .option('strictMode', {
    alias: 'm',
    type: 'boolean',
    default: true,
    description: 'Strict mode checks'
  })
  .option('weightsJson', {
    alias: 'w',
    type: 'string',
    default: 'cypress/parallel-weights.json',
    description: 'Parallel weights json file'
  }).argv;

if (!argv.script) {
  throw new Error('Expected command, e.g.: cypress-parallel <cypress-script>');
}

const COLORS = [
  '\x1b[32m',
  '\x1b[36m',
  '\x1b[29m',
  '\x1b[33m',
  '\x1b[37m',
  '\x1b[38m',
  '\x1b[39m',
  '\x1b[40m'
];

/** @type {{
    threadCount: number
    testSuitesPaths: string[]
    shouldBail: boolean
    isVerbose: boolean
    weightsJSON: string
    defaultWeight: number
    reporter?: string
    reporterModulePath: string
    reporterOptions?: string
    reporterOptionsPath?: string
    script: string
    strictMode: boolean
    scriptArguments: string[]
 }} */
const settings = {
  threadCount: argv.threads,
  testSuitesPath: argv.specsDir,
  testSuitesPaths: argv.spec,
  shouldBail: argv.bail,
  isVerbose: argv.verbose,
  weightsJSON: argv.weightsJson,
  defaultWeight: 1,
  reporter: argv.reporter,
  reporterModulePath: argv.reporterModulePath,
  reporterOptions: argv.reporterOptions,
  reporterOptionsPath: argv.reporterOptionsPath,
  script: argv.script,
  strictMode: argv.strictMode,
  scriptArguments: argv.args ? argv.args.split(' ') : []
};

process.env.CY_PARALLEL_SETTINGS = JSON.stringify(settings);

module.exports = {
  settings,
  COLORS
};
