#!/usr/bin/env node

const program = require('./includes/cli-options')

const {
  getGlobalDefinition,
  getSystemDefinition,
  getModuleDefinitions,
  getMergedDefinition,
  syncTemplates,
  syncDockerTemplates,
  syncVagrantfile,
  syncConfig
} = require('./includes/config')

const { system, modules, test } = program.opts()

if (test) {
  modules.push('vagrant-test')
}

const GlobalDefinition = getGlobalDefinition()
const SystemDefinition = getSystemDefinition(system)
const ModuleDefinitions = getModuleDefinitions([ ...GlobalDefinition.modules, ...SystemDefinition.modules, ...modules ])

const MergedDefinitions = getMergedDefinition([ GlobalDefinition, SystemDefinition, ...ModuleDefinitions ])

syncTemplates(MergedDefinitions.templates)
syncVagrantfile(MergedDefinitions.vagrantfile)
syncDockerTemplates(MergedDefinitions.dockerTemplates)
syncConfig(MergedDefinitions.config)
