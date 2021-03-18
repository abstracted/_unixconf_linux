const deepequal = require('deep-equal')
const deepmerge = require('deepmerge')

const {
  DOCKER_TEMPLATES_PATH,
  GLOBAL_PATH,
  MODULE_PATH,
  PLAYBOOK_PATH,
  SYSTEM_PATH,
  TEMPLATES_PATH,
  VARS_PATH
} = require('./dictionary.js')

const {
  exec,
  getYaml,
  makeDir,
  statPath,
  writeYaml
} = require('./helpers.js')

function arrayCombineMerge (target, source, options) {
  const destination = target.slice()
  source.forEach((item, index) => {
    if (typeof destination[index] === 'undefined') {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options)
    } else if (options.isMergeableObject(item)) {
      const isMergableObjectEqual = deepequal(destination[index], item)
      if (isMergableObjectEqual !== true) {
        destination.push(item)
      }
    } else if (target.indexOf(item) === -1) {
      destination.push(item)
    }
  })
  return destination
}

function getDefinition ({ path }) {
  const pathExists = statPath(path)

  const configDefault = {}
  const modulesDefault = []
  const packagesDefault = {}
  const vagrantfileDefault = false
  const templatesDefault = false
  const dockerTemplatesDefault = false

  if (!pathExists) {
    return {
      path,
      config: configDefault,
      modules: modulesDefault,
      packages: packagesDefault,
      vagrantfile: vagrantfileDefault,
      templates: templatesDefault,
      dockerTemplates: dockerTemplatesDefault
    }
  }

  const name = path.split('/').pop()

  const configPath = `${path}/${name}.yml`
  const config = statPath(configPath) ? getYaml(configPath) : configDefault

  const modulesPath = `${path}/modules.yml`
  const modules = statPath(modulesPath) ? getYaml(modulesPath) : modulesDefault

  const packagesPath = `${path}/packages.yml`
  const packages = statPath(packagesPath) ? getYaml(packagesPath) : packagesDefault

  const vagrantfilePath = `${path}/Vagrantfile`
  const vagrantfile = statPath(vagrantfilePath) ? vagrantfilePath : vagrantfileDefault

  const templatesPath = `${path}/templates`
  const templates = statPath(templatesPath) ? templatesPath : templatesDefault

  const dockerTemplatesPath = `${path}/docker-templates`
  const dockerTemplates = statPath(dockerTemplatesPath) ? dockerTemplatesPath : dockerTemplatesDefault

  return {
    path,
    config,
    modules,
    packages,
    vagrantfile,
    templates,
    dockerTemplates
  }
}

function getGlobalDefinition () {
  return getDefinition({ path: GLOBAL_PATH })
}

function getSystemDefinition (system) {
  return getDefinition({ path: `${SYSTEM_PATH}/${system}` })
}

function getModuleDefinitions (modulesList) {
  if (!Array.isArray(modulesList) || !modulesList.length) {
    return []
  }

  const modules = [ ...modulesList ]

  let modulesTemp = [ ...modulesList ]
  let search = true

  while (search) {
    const submodules = modulesTemp
      .map(m => getDefinition({ path: `${MODULE_PATH}/${m}` }))
      .map(submodule => submodule.modules)
      .flat(Infinity)

    if (!submodules.length) {
      search = false
    }

    const isCircular = modules
      .filter(m => submodules.filter(s => s === m).length).length > 0

    if (isCircular) {
      console.error('Modules create a circular dependency, halting!')
      console.error('Current Modules:', modules)
      process.exit(1)
    }

    modulesTemp = [ ...submodules ]
    submodules.forEach(submodule => modules.push(submodule))
  }

  const moduleDefinitions = modules
    .map(module => getDefinition({ path: `${MODULE_PATH}/${module}` }))

  return moduleDefinitions
}

function getMergedDefinition (definitionsList) {
  const packages = definitionsList.map(({ packages }) => packages)
  const packagesMerged = deepmerge.all(packages, { arrayMerge: arrayCombineMerge })

  const packagesCategories = definitionsList.map(({ config }) => 'packages_categories' in config ? config.packages_categories : [])
  const packagesCategoriesMerged = deepmerge.all(packagesCategories, { arrayMerge: arrayCombineMerge })

  const packagesUsed = packagesCategoriesMerged.map(category => category in packagesMerged ? packagesMerged[category] : []).flat(Infinity)

  const configs = definitionsList.map(({ config }) => config)
  const configsMerged = deepmerge.all(configs, { arrayMerge: arrayCombineMerge })

  const modules = definitionsList.map(({ modules }) => modules).flat(Infinity)
  const templates = definitionsList.map(({ templates }) => templates).filter(template => template)
  const dockerTemplates = definitionsList.map(({ dockerTemplates }) => dockerTemplates).filter(dockerTemplate => dockerTemplate)
  const vagrantfile = definitionsList.reverse().reduce((pre, cur) => {
    if (pre) {
      return pre
    }
    if (cur.vagrantfile) {
      return cur.vagrantfile
    }
    return false
  }, false)

  const mergedDefinition = {
    config: {
      ...configsMerged,
      packages: packagesUsed
    },
    packages: packagesUsed,
    modules,
    templates,
    vagrantfile,
    dockerTemplates
  }

  return mergedDefinition
}

function syncTemplates (templates) {
  if (!Array.isArray(templates) || !templates.length) {
    return false
  }

  const rsync = exec('which rsync')

  if (!rsync) {
    return false
  }

  const templatesPathExists = statPath(TEMPLATES_PATH)

  if (!templatesPathExists) {
    makeDir(TEMPLATES_PATH)
  }

  templates.forEach((template, index) => {
    const rsyncCommand = `${rsync} -avhz --update ${template}/ ${TEMPLATES_PATH}/`
    const options = index === 0 ? '--delete-after' : ''

    exec(`${rsyncCommand} ${options}`)
  })
}

function syncDockerTemplates (dockerTemplates) {
  if (!Array.isArray(dockerTemplates) || !dockerTemplates.length) {
    return false
  }

  const rsync = exec('which rsync')

  if (!rsync) {
    return false
  }

  const dockerTemplatesPathExists = statPath(DOCKER_TEMPLATES_PATH)

  if (!dockerTemplatesPathExists) {
    makeDir(DOCKER_TEMPLATES_PATH)
  }

  dockerTemplates.forEach((dockerTemplate, index) => {
    const rsyncCommand = `${rsync} -avhz --update ${dockerTemplate}/ ${DOCKER_TEMPLATES_PATH}/`
    const options = index === 0 ? '--delete-after' : ''

    exec(`${rsyncCommand} ${options}`)
  })
}

function syncVagrantfile (vagrantfile) {
  if (!vagrantfile) {
    return false
  }

  const cp = exec('which cp')

  if (!cp) {
    return false
  }

  const playbookPathExists = statPath(PLAYBOOK_PATH)

  if (!playbookPathExists) {
    makeDir(PLAYBOOK_PATH)
  }

  exec(`${cp} -f ${vagrantfile} ${PLAYBOOK_PATH}`)
}

function syncConfig (config) {
  if (!config) {
    return false
  }

  const varsPathExists = statPath(VARS_PATH)

  if (!varsPathExists) {
    makeDir(VARS_PATH)
  }

  writeYaml(config, `${VARS_PATH}/config.yml`)
}

module.exports = {
  getGlobalDefinition,
  getSystemDefinition,
  getModuleDefinitions,
  getMergedDefinition,
  syncTemplates,
  syncDockerTemplates,
  syncVagrantfile,
  syncConfig
}

// CONFIG DIFFING FUNCTIONALITY: Was removed to reduce the complexity of the script
// function getStoreConfigs (system) {
//   const storePathExists = statPath(STORE_PATH)
//   if (storePathExists) {
//     const storeList = lsPath(`${STORE_PATH}/${system}`)
//     if (storeList) {
//       const storeListNumbers = storeList.map(file => Number(file.replace(/\.yml$/, '')))
//       const storeConfigs = storeListNumbers.sort().map(store => getYaml(`${STORE_PATH}/${system}/${store}.yml`))
//       return storeConfigs
//     }
//   }
//   return []
// }
// function getRemovedUsers (system) {
//   const storeConfigs = getStoreConfigs(system)
//   const configNew = storeConfigs[storeConfigs.length - 1]
//   const usersNew = configNew.users
//   if (storeConfigs.length === 1) {
//     // can't be any changes as there's only one item
//     return []
//   } else if (Array.isArray(usersNew)) {
//     // find the items deleted in usersNew
//     const removedUsers = storeConfigs.reduce((acc, cur) => {
//       const { users: usersOld } = cur
//       if (usersOld && usersNew) {
//         const removed = usersOld.filter(
//           usr => usersNew.filter(
//             u => u.name === usr.name
//           ).length < 1
//         )
//         return [...acc, ...removed]
//       } else {
//         return acc
//       }
//     }, []).sort().filter((usr, idx, arr) => {
//       return usr !== arr[usr - 1]
//     })
//     return removedUsers.map(({ name }) => name)
//   } else {
//     const hasNoUsers = storeConfigs.filter(({ users }) => Array.isArray(users) !== true).length === storeConfigs.length
//     if (hasNoUsers !== true) {
//       // All users were deleted
//       const storeConfigsOld = storeConfigs.filter(({ users }) => Array.isArray(users) === true)
//       const storeConfigsMerge = deepmerge.all(storeConfigsOld, { arrayMerge: arrayCombineMerge })
//       const removedUsers = storeConfigsMerge.users.map(({ name }) => name)
//       return removedUsers
//     } else {
//       // There were never any users
//       return []
//     }
//   }
// }
// function getRemovedServices (system) {
//   const storeConfigs = getStoreConfigs(system)
//   const configNew = storeConfigs[storeConfigs.length - 1]
//   const servicesNew = configNew.services
//   if (storeConfigs.length === 1) {
//     // can't be any changes as there's only one item
//     return []
//   } else if (Array.isArray(servicesNew)) {
//     // find the items deleted in servicesNew
//     const removedServices = storeConfigs.reduce((acc, cur) => {
//       const { services: servicesOld } = cur
//       if (servicesOld && servicesNew) {
//         const removed = servicesOld.filter(
//           srv => servicesNew.filter(
//             s => s.name === srv.name
//           ).length < 1
//         )
//         return [...acc, ...removed]
//       } else {
//         return acc
//       }
//     }, []).sort().filter((srv, idx, arr) => {
//       return srv !== arr[srv - 1]
//     })
//     return removedServices.map(({ name }) => name)
//   } else {
//     const hasNoServices = storeConfigs.filter(({ services }) => Array.isArray(services) !== true).length === storeConfigs.length
//     if (hasNoServices !== true) {
//       // All services were deleted
//       const storeConfigsOld = storeConfigs.filter(({ services }) => Array.isArray(services) === true)
//       const storeConfigsMerge = deepmerge.all(storeConfigsOld, { arrayMerge: arrayCombineMerge })
//       const removedServices = storeConfigsMerge.services.map(({ name }) => name)
//       return removedServices
//     } else {
//       // There were never any services
//       return []
//     }
//   }
// }
// function getRemovedPackages (system) {
//   const storeConfigs = getStoreConfigs(system)
//   const configNew = storeConfigs[storeConfigs.length - 1]
//   const packagesNew = configNew.packages
//   if (storeConfigs.length === 1) {
//     // can't be any changes as there's only one item
//     return []
//   } else if (Array.isArray(packagesNew)) {
//     // find the items deleted in packagesNew
//     const removedPackages = storeConfigs.reduce((acc, cur) => {
//       const { packages: packagesOld } = cur
//       const removed = packagesOld.filter(
//         pkg => packagesNew.filter(
//           p => p === pkg
//         ).length < 1
//       )
//       return [...acc, ...removed]
//     }, []).sort().filter((pkg, idx, arr) => {
//       return pkg !== arr[idx - 1]
//     })
//     return removedPackages
//   } else {
//     const hasNoPackages = storeConfigs.filter(({ packages }) => Array.isArray(packages) !== true).length === storeConfigs.length
//     if (hasNoPackages !== true) {
//       // All packages were deleted
//       const storeConfigsOld = storeConfigs.filter(({ packages }) => Array.isArray(packages) === true)
//       const storeConfigsMerge = deepmerge.all(storeConfigsOld, { arrayMerge: arrayCombineMerge })
//       const removedPackages = storeConfigsMerge.packages.map(pkg => pkg)
//       return removedPackages
//     } else {
//       // There were never any packages
//       return []
//     }
//   }
// }
// function getConfigDiff (system) {
//   const storeConfigs = getStoreConfigs(system)
//   const configDiff = {
//     users_remove: storeConfigs.length ? getRemovedUsers(system) : [],
//     services_remove: storeConfigs.length ? getRemovedServices(system) : [],
//     packages_remove: storeConfigs.length ? getRemovedPackages(system) : []
//   }
//   return configDiff
// }
// function setConfigDiff(options) {
//   const { system, config } = options
//   const storeConfigs = getStoreConfigs(system)
//   function writeStoreYaml () {
//     writeYaml(config, `${STORE_PATH}/${system}`, `${Date.now()}.yml`)
//   }
//   if (storeConfigs.length) {
//     const storeConfigLast = storeConfigs[storeConfigs.length - 1]
//     const storeEqual = deepequal(config, storeConfigLast)
//     if (storeEqual !== true) {
//       writeStoreYaml()
//     }
//   } else {
//     writeStoreYaml()
//   }
//   The second section writes to the playbook config file vars/config.yml
//   const configDiff = getConfigDiff(system)
//   const configNext = deepmerge(config, configDiff)
//   const configEqual = deepequal(configPrevious, configNext)
//   if (configEqual !== true) {
//     writeYaml(configNext, VARS_PATH, 'config.yml')
//   }
// }
