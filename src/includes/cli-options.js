const program = require('commander')

const { parseCommaSeparatedList } = require('./helpers')

const { MODULE_PATH, SYSTEM_PATH } = require('./dictionary.js')

program
  .option(`-m, --modules <modules>', 'Comma separated list of modules to add to the sytem configuration. Module configs are stored in ${MODULE_PATH}`, null, parseCommaSeparatedList, [])
  .option(`-s, --system <system>', 'Specific system to use. System configs are stored in ${SYSTEM_PATH}`)
  .parse()

module.exports = program
