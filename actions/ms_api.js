let path = require('path')
let fs = require('fs')
let v = require('voca')
let _ = require('lodash');
let os = require('os');
const fsextra = require('fs-extra');
const common = require('../function/common');

const { exec } = require('child_process');
const { log } = require('console');



function ExecuteCommandInPath(command, targetPath) {
    return new Promise((resolve, reject) => {
        // Cambiar al directorio específico y ejecutar el comando
        exec(command, { cwd: targetPath }, (error, stdout, stderr) => {
            if (error) {
                console.error('ERROR', error);
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error('ERROR', stderr);
                reject(`Stderr: ${stderr}`);
                return;
            }
            console.log('Executed nest correctly * * * * * * ** \n', stdout);
            resolve(stdout);
        });
    });
}


let create = async function ({ name }) {

    const userHomeDir = os.homedir();
    let configFile = path.join(userHomeDir, '.msgonest_cli', 'config.json')
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

    let pathAPI = path.resolve(configJson.base_API_folder)

    let statsAPI = fs.statSync(pathAPI)
    if (!statsAPI.isDirectory()) {
        throw new Error('Some of the directories is invalid')
    }

    let microserviceCamel = v.camelCase(name)
    let microserviceSnake = v.snakeCase(name)
    let microserviceLower = v.lowerCase(name)
    let microserviceCap = v.capitalize(name).replaceAll('_', '').replaceAll(' ', '')

    try {
        await ExecuteCommandInPath('nest generate app ' + microserviceLower, pathAPI)
    } catch (error) {
        console.log(error);
        throw new Error('We cannot execute nest CLI be shure is installed globally')
    }



    let statsAPIFolderTest = path.join(pathAPI, 'apps', microserviceLower, 'test')
    await fsextra.remove(statsAPIFolderTest);

    let statsAPIFolderSRC = path.join(pathAPI, 'apps', microserviceLower, 'src')

    let statsAPIFolderSRCSpecFile = path.join(statsAPIFolderSRC, `${microserviceLower}.controller.spec.ts`)
    await fsextra.remove(statsAPIFolderSRCSpecFile);


    let statsAPIFolderSRCControllers = path.join(statsAPIFolderSRC, 'controllers')
    let statsAPIFolderSRCServices = path.join(statsAPIFolderSRC, 'services')
    let statsAPIFolderSRCDtos = path.join(statsAPIFolderSRC, 'dtos')
    let statsAPIFolderSRCEntities = path.join(statsAPIFolderSRC, 'entities')
    let statsAPIFolderSRCGrpc = path.join(statsAPIFolderSRC, 'grpc')
    let statsAPIFolderSRCMappers = path.join(statsAPIFolderSRC, 'mappers')

    await fsextra.ensureDir(statsAPIFolderSRCControllers)
    await fsextra.ensureDir(statsAPIFolderSRCServices)
    await fsextra.ensureDir(statsAPIFolderSRCDtos)
    await fsextra.ensureDir(statsAPIFolderSRCEntities)
    await fsextra.ensureDir(statsAPIFolderSRCGrpc)
    await fsextra.ensureDir(statsAPIFolderSRCMappers)

    let statsAPIFolderSRCControllerFile = path.join(statsAPIFolderSRC, `${microserviceLower}.controller.ts`)

    let statsAPIFolderSRCServiceFile = path.join(statsAPIFolderSRC, `${microserviceLower}.service.ts`)

    let line_controller = `import { GrpcMethod } from '@nestjs/microservices';
import {  ${microserviceLower.toUpperCase()}_SERVICE_NAME } from '../grpc/${microserviceLower}/${microserviceLower}.pb';`

    let templateController = fs.readFileSync(statsAPIFolderSRCControllerFile, { encoding: 'utf8', flag: 'r' })
    let templateService = fs.readFileSync(statsAPIFolderSRCServiceFile, { encoding: 'utf8', flag: 'r' })

    templateController = templateController.replaceAll(`./${microserviceLower}.service`, `../services/${microserviceLower}.service`)
    templateController = templateController.replaceAll(`@Controller()`, `
        ${line_controller}


        @Controller()
        `)

    let statsAPIFolderSRCControllerFileDest = path.join(statsAPIFolderSRC, 'controllers', `${microserviceLower}.controller.ts`)
    await fs.writeFileSync(statsAPIFolderSRCControllerFileDest, templateController, 'utf8');
    await fsextra.remove(statsAPIFolderSRCControllerFile);


    templateService = templateService.replace(`import { Injectable } from '@nestjs/common';`, `import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';


const responses = {
  conflict: (message: string) => ({
    status: HttpStatus.CONFLICT,
    error: {
      type: 'CONFLICT',
      message: message,
    },
  }),
  notFound: (message: string | null) => ({
    status: HttpStatus.NOT_FOUND,
    error: {
      type: 'NOT_FOUND',
      message: message ?? 'Specified entity was not found',
    },
  }),
  badRequest: (message?: string) => ({
    status: HttpStatus.BAD_REQUEST,
    error: {
      type: 'bad_request',
      message: message ?? 'Bad Request',
    },
    data: null,
  }),
  ok: {
    status: HttpStatus.OK,
    error: null,
  },
  data: <T>(data: T) => ({
    status: HttpStatus.OK,
    error: null,
    data: data,
  }),
};

`)

    templateService = templateService.replaceAll(`@Injectable()
export class ${microserviceCap}Service {`, `@Injectable()
export class ${microserviceCap}Service {

 private readonly logger = new Logger(${microserviceCap}Service.name);
`)

    let statsAPIFolderSRCServiceFileDest = path.join(statsAPIFolderSRC, 'services', `${microserviceLower}.service.ts`)
    await fs.writeFileSync(statsAPIFolderSRCServiceFileDest, templateService, 'utf8');
    await fsextra.remove(statsAPIFolderSRCServiceFile);



    let templateModule = fs.readFileSync(path.join(__dirname, 'templates', 'api', 'module.ts'), { encoding: 'utf8', flag: 'r' })
    let templateMain = fs.readFileSync(path.join(__dirname, 'templates', 'api', 'main.ts'), { encoding: 'utf8', flag: 'r' })

    let templateBuildspec = fs.readFileSync(path.join(__dirname, 'templates', 'api', 'buildspec.yaml'), { encoding: 'utf8', flag: 'r' })
    let templateDockerfile = fs.readFileSync(path.join(__dirname, 'templates', 'api', 'Dockerfile'), { encoding: 'utf8', flag: 'r' })

    templateModule = templateModule.replaceAll('{{___microservice_cap___}}', microserviceCap)
    templateModule = templateModule.replaceAll('{{___microservice_lower___}}', microserviceLower)


    templateMain = templateMain.replaceAll('{{___microservice_cap___}}', microserviceCap)
    templateMain = templateMain.replaceAll('{{___microservice_lower___}}', microserviceLower)


    templateDockerfile = templateDockerfile.replaceAll('{{___microservice_lower___}}', microserviceLower)


    let moduleFileDest = path.join(statsAPIFolderSRC, `${microserviceLower}.module.ts`)
    await fs.writeFileSync(moduleFileDest, templateModule, 'utf8');

    let mainFileDest = path.join(statsAPIFolderSRC, `main.ts`)
    await fs.writeFileSync(mainFileDest, templateMain, 'utf8');


    let buildSepcFileDest = path.join(statsAPIFolderSRC, `buildspec.yaml`)
    await fs.writeFileSync(buildSepcFileDest, templateBuildspec, 'utf8');

    let dockerfileFileDest = path.join(statsAPIFolderSRC, `Dockerfile`)
    await fs.writeFileSync(dockerfileFileDest, templateDockerfile, 'utf8');





    console.log('Created succesfull , dont forget edit config and .env to set Port an URI  // TODO REPLACE THE PORT  ');

}
module.exports = create
