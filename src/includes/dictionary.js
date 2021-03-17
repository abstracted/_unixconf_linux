const path = require('path')

// const STORE_PATH = 'store'
const PLAYBOOK_PATH = path.resolve(__dirname, '../../playbook')
const VARS_PATH = path.join(PLAYBOOK_PATH, 'vars')
const TEMPLATES_PATH = path.join(PLAYBOOK_PATH, 'templates')

const CONFIG_PATH = path.resolve(__dirname, '../../config')
const GLOBAL_PATH = path.join(CONFIG_PATH, 'global')
const MODULE_PATH = path.join(CONFIG_PATH, 'modules')
const SYSTEM_PATH = path.join(CONFIG_PATH, 'systems')

const DOCKER_TEMPLATES_PATH = path.resolve(PLAYBOOK_PATH, 'docker-templates')

module.exports = {
  // STORE_PATH,
  CONFIG_PATH,
  DOCKER_TEMPLATES_PATH,
  GLOBAL_PATH,
  MODULE_PATH,
  PLAYBOOK_PATH,
  SYSTEM_PATH,
  TEMPLATES_PATH,
  VARS_PATH
}
