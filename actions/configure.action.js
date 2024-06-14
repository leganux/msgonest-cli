const os = require("os");
const path = require("path");
const makeDir = require('make-dir');
const fs = require('fs')
const { questionAsync } = require('./../function/common')
const {promisify} = require("util");

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

module.exports = async function () {
    console.log('Welcome now we gonna configure rumor cli engine... \n')
    const userHomeDir = os.homedir();

    let configFolder = path.join(userHomeDir, '.rumor_cli')
    let configFile = path.join(userHomeDir, '.rumor_cli', 'config.json')


    let jsonConfig = {
        "base_grpc_folder": "",
        "base_API_folder": "",
        "base_API_GATEWAY_folder": "",
    }

    if (!fs.existsSync(configFolder)) {
        await makeDir(configFolder)
    }


    jsonConfig.base_grpc_folder = questionAsync('Give me the full absoluthe path of GRPC project root: ')
    jsonConfig.base_API_folder = questionAsync('Give me the full absoluthe path of API project root: ')
    jsonConfig.base_API_GATEWAY_folder = questionAsync('Give me the full absoluthe path of API-Gateway project root: ')

    await writeFileAsync(configFile, JSON.stringify(jsonConfig, null, '\t'), 'utf8');
    console.log('Saved correctly');

}