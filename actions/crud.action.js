let crud_gateway = require('./crud_gateway.action')
let crud_api = require('./crud_api.action')
let crud_grpc = require('./crud_grpc.action')


let fs = require('fs')
const os = require("os");
const path = require("path");

module.exports = async function ({project, json}) {


    const userHomeDir = os.homedir();
    let configFile = path.join(userHomeDir, '.msgonest_cli', 'config.json')
    if (!fs.existsSync(configFile)) {
        throw new Error('We can not find config file, please execute "configure" comand please  \t')
    }

    let configJson = fs.readFileSync(configFile, {encoding: 'utf8', flag: 'r'})
    configJson = JSON.parse(configJson)

    console.log('Configuration readed');

    if (!fs.existsSync(path.resolve(json[0]))) {
        throw new Error('We can not find shcema template file, please choose correct file  \t')
    }

    json = fs.readFileSync(json[0], {encoding: 'utf8', flag: 'r'})
    json = JSON.parse(json)


    if (!project || project.legth < 1) {
        await crud_gateway(configJson, json)
        await crud_api(configJson, json)
        await crud_grpc(configJson, json)

        return
    }
    project = project[0]
    if (project == 'grpc') {
        await crud_grpc(configJson, json)
    } else if (project == 'gateway') {
        await crud_gateway(configJson, json)

    } else if (project == 'api') {

        await crud_api(configJson, json)

    } else {
        await crud_gateway(configJson, json)
        await crud_api(configJson, json)
        await crud_grpc(configJson, json)
    }
}
