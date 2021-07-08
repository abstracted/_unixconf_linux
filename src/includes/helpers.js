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
      .filter(dir => dir !== '.DS_Store')

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

function getPropertyTree(obj, depth = 1, path = '{}') {

  function pushPath(path, key) {
    return path.concat('.', key)
  }
  function popPath(path) {
    return path.replace(/(.*)\.[^\.]+$/, '$1')
  }
  function getMetaObj({ type, valueName, value, depth, path }) {
    return {  __path: path, __depth: depth, __type: type, [`__${valueName}`]: value }
  }

  for (let key in obj) {
    const type = Array.isArray(obj[key]) 
      ? 'array'
      : typeof obj[key]
    
    path = isNaN(parseInt(key)) ? pushPath(path, key) : path.concat('', '[]')

    if (type !== 'object' && type !== 'array') {
      obj[key] = getMetaObj({ path, depth, type, valueName: 'example', value: obj[key] })
    } else if (type === 'object' || type === 'array') {
      depth += 1
      
      obj[key] = getPropertyTree(obj[key], depth, path)
      
      depth -= 1

      if (type === 'object') {
        obj[key] = getMetaObj({ path, depth, type, valueName: 'properties', value: obj[key] })
        
      } else if (type === 'array') {
        obj[key] = obj[key].sort((a, b) => 
          (a.__type < b.__type && -1) || 
          (a.__type > b.__type && 1)  || 
          0
        ).filter((val, idx, arr) => 
          idx === 0 || arr[idx - 1].__type !== val.__type
        )

        obj[key] = getMetaObj({ path, depth, type, valueName: 'items', value: obj[key] })
      }
    }
    
    path = popPath(path)
  }

  return obj
}

module.exports = {
  exec,
  log,
  getPropertyTree,
  throwError,
  makeDir,
  statPath,
  lsPath,
  getYaml,
  writeYaml,
  parseCommaSeparatedList
}
