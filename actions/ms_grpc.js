let path = require('path')
let fs = require('fs')
let v = require('voca')
let _ = require('lodash');
let os = require('os');

const fsextra = require('fs-extra');


async function insertGRPCDynamicCodeMessage(filePath, newCode) {
    try {

        await fs.writeFileSync(filePath, newCode, 'utf8');
        console.log('Code added successfully.');

    } catch (err) {
        console.error('Error:', err);
    }
}


let create = async function ({ name }) {

    const userHomeDir = os.homedir();
    let configFile = path.join(userHomeDir, '.rumor_cli', 'config.json')
    if (!fs.existsSync(configFile)) {
        throw new Error('We can not find config file, please execute "configure" comand please  \t')

    }
    if (!name || name.length < 1) {
        throw new Error('You must to define microservice name    -n < name_microservice >  \t')
    }
    name = name[0]

    let configJson = fs.readFileSync(configFile, { encoding: 'utf8', flag: 'r' })
    configJson = JSON.parse(configJson)

    console.log('Configuration readed');

    let pathGRPC = path.resolve(configJson.base_grpc_folder)

    let statsGRPC = fs.statSync(pathGRPC)
    if (!statsGRPC.isDirectory()) {
        throw new Error('Some of the directories is invalid')
    }

    let microserviceCamel = v.camelCase(name)
    let microserviceSnake = v.snakeCase(name)
    let microserviceCap = v.capitalize(name).replaceAll('_', '').replaceAll(' ', '')

    let grpcServiceFile = path.join(pathGRPC, microserviceCamel, microserviceCamel + '.proto')
    let grpcServiceFolder = path.join(pathGRPC, microserviceCamel)

    await fsextra.ensureDir(grpcServiceFolder);

    let content = `
    syntax = 'proto3';

package ${microserviceSnake};

option go_package = './';

service ${microserviceCap}Service {
  
}

//Error
message Error {
  string type = 1;
  string message = 2;
}

//Generic Response
message GenericResponse {
  int32 status = 1;
  optional Error error = 2;
}

// Empty Request
message EmptyRequest {}


    `
    await insertGRPCDynamicCodeMessage(grpcServiceFile, content)

    console.log('Created succesfull');

}
module.exports = create