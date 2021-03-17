const {
  statSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync
} = require('fs')
const { execSync } = require('child_process')

const yaml = require('js-yaml')
const chalk = require('chalk')

function exec (command) {
  try {
    return execSync(command)
      .toString()
      .replace('node_modules', '')
      .trim()
  } catch (error) {
    return ''
  }
}

function log (color, message, ...messages) {
  console.log(chalk[color](message + messages.join(' ')))
}

function throwError (message, error) {
  if (message) {
    log('yellow', message)
  }
  if (error) {
    log('red', error)
  }
  process.exit()
}

function makeDir (path) {
  try {
    statSync(path)
  } catch (error) {
    mkdirSync(path, { recursive: true })
    log('gray', `Creating directory at ${path}`)
  }
}

function statPath (path) {
  try {
    statSync(path)
    return true
  } catch (error) {
    return false
  }
}

function lsPath (path) {
  try {
    const ls = readdirSync(path)

    return ls
  } catch (error) {
    return []
  }
}

function getYaml (path) {
  const pathExists = statPath(path)

  if (pathExists) {
    const json = yaml.safeLoad(readFileSync(path, 'utf8'))
    return json
  } else {
    return {}
  }
}

function writeYaml (json, path) {
  writeFileSync(path, yaml.safeDump(json))
}

function parseCommaSeparatedList (list) {
  if (list) {
    return list.split(',')
  } else {
    return []
  }
}

module.exports = {
  exec,
  log,
  throwError,
  makeDir,
  statPath,
  lsPath,
  getYaml,
  writeYaml,
  parseCommaSeparatedList
}
