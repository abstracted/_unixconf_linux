#!/usr/bin/env node

const { getDefinitionsPropertyTree } = require('./includes/config')
const { writeYaml } = require('./includes/helpers')

const { config, packages } = getDefinitionsPropertyTree()
writeYaml({ config, packages }, `${__dirname}/configTree.yml`)