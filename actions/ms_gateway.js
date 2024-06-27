let path = require('path')
let fs = require('fs')
let v = require('voca')
let _ = require('lodash');
let os = require('os');
const fsextra = require('fs-extra');
const common = require('../function/common');


async function insertgateway(filePath, newCode) {
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

    let pathAPIGATEWAY = path.resolve(configJson.base_API_GATEWAY_folder)

    let statsAPIgateway = fs.statSync(pathAPIGATEWAY)
    if (!statsAPIgateway.isDirectory()) {
        throw new Error('Some of the directories is invalid')
    }

    let microserviceCamel = v.camelCase(name)
    let microserviceSnake = v.snakeCase(name)
    let microserviceLower = v.lowerCase(name)
    let microserviceCap = v.capitalize(name).replaceAll('_', '').replaceAll(' ', '')

    let microServiceFolder = path.join(pathAPIGATEWAY, 'pkg', microserviceCamel)
    let microServiceFolderRoutes = path.join(pathAPIGATEWAY, 'pkg', microserviceCamel, 'routes')
    let microServiceFolderPb = path.join(pathAPIGATEWAY, 'pkg', microserviceCamel, 'pb')

    let microServiceFileClient = path.join(pathAPIGATEWAY, 'pkg', microserviceCamel, 'client.go')
    let microServiceFileRoutes = path.join(pathAPIGATEWAY, 'pkg', microserviceCamel, 'routes.go')

    await fsextra.ensureDir(microServiceFolder);
    await fsextra.ensureDir(microServiceFolderRoutes);
    await fsextra.ensureDir(microServiceFolderPb);

    let templateClient = fs.readFileSync(path.join(__dirname, 'templates', 'microservice', 'gateway', 'client.go'), { encoding: 'utf8', flag: 'r' })
    let templateRoutes = fs.readFileSync(path.join(__dirname, 'templates', 'microservice', 'gateway', 'routes.go'), { encoding: 'utf8', flag: 'r' })

    templateClient = templateClient.replaceAll('{{___name_lower___}}', microserviceLower)
    templateClient = templateClient.replaceAll('{{___name_cap___}}', microserviceCap)

    templateRoutes = templateRoutes.replaceAll('{{___name_lower___}}', microserviceLower)

    await insertgateway(microServiceFileClient, templateClient)
    await insertgateway(microServiceFileRoutes, templateRoutes)

    let lineToMain = `\n${microserviceLower}.RegisterRoutes(app, c)\n`

    let lineToMain2 = `\n${microserviceLower} "rumor-api-gateway/pkg/${microserviceLower}"\n`

    let microServiceFileMain = path.join(pathAPIGATEWAY, 'cmd', 'main.go')

    let fileMain = fs.readFileSync(microServiceFileMain, { encoding: 'utf8', flag: 'r' })

    fileMain = fileMain.replace(`// Routes
	app.Get("/", HealthCheck)`, `${lineToMain}
    
    // Routes
	app.Get("/", HealthCheck)`)

    fileMain = fileMain.replace(`"rumor-api-gateway/docs"`, `"rumor-api-gateway/docs"\n ${lineToMain2}`)

    await insertgateway(microServiceFileMain, fileMain)

    console.log('Created succesfull , dont forget edit config and .env to set Port an URI');

}
module.exports = create