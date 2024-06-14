#! /usr/bin/env node

const { program } = require('commander')
const grpc = require('./actions/grpc.action')
const api = require('./actions/api.action')
const gateway = require('./actions/gateway.action')
const full = require('./actions/full.action')
const configure = require('./actions/configure.action')

program
    .command('config')
    .description('Create or update the config file for rumor cli engine')
    .action(configure)

program
    .command('full')
    .description('Runs complete script and generate code for API,Gateway,GRPC')
    .option('-p, --path_ <path_...>', 'The full path of json template')
    .action(full)


program
    .command('grpc')
    .description('Runs only script for GRPC')
    .option('-p, --path_ <path_...>', 'The full path of json template')
    .action(grpc)

program
    .command('gateway')
    .description('Runs only script for GATEWAY')
    .option('-p, --path_ <path_...>', 'The full path of json template')
    .action(gateway)

program
    .command('api')
    .description('Runs only script for API')
    .option('-p, --path_ <path_...>', 'The full path of json template')
    .action(api)

//TODO: Generate CRUD for a table 
program
    .command('crud')
    .description('COMMING SOON:  Will create a basic crud endpoints automatically based on JSON')
    .option('-p, --path_ <path_...>', 'The full path of json template')
    .action(full)



program.parse()