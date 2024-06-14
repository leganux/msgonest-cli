
const prompt = require('prompt-sync')();
let fs = require('fs')
const os = require("os");
const path = require("path");

function questionAsync(prompt_) {
    return prompt(prompt_);
}

module.exports = {
    questionAsync,
    validateAndExtractJson: async function (path_) {
        const userHomeDir = os.homedir();
        let configFile = path.join(userHomeDir, '.rumor_cli', 'config.json')
        if (!fs.existsSync(configFile)) {
            throw new Error('We can not find config file, please execute "configure" comand please  \t')

        }

        let configJson = fs.readFileSync(configFile, { encoding: 'utf8', flag: 'r' })
        configJson = JSON.parse(configJson)

        console.log('Configuration readed');

        let json = fs.readFileSync(path_, { encoding: 'utf8', flag: 'r' })
        json = JSON.parse(json)

        console.log('Json file readed');

        json = { ...json, ...configJson }

        if (!json.base_grpc_folder || !json.base_API_folder || !json.base_API_GATEWAY_folder ||
            json.base_grpc_folder == '' || json.base_API_folder == '' || json.base_API_GATEWAY_folder == '') {
            throw new Error('Path folders must be defined')
        }

        let pathGRPC = path.resolve(json.base_grpc_folder)
        let pathAPI = path.resolve(json.base_API_folder)
        let pathAPIGATEWAY = path.resolve(json.base_API_GATEWAY_folder)

        let statsGRPC = fs.statSync(pathGRPC)
        let statsAPI = fs.statSync(pathAPI)
        let statsAPIGATEWAY = fs.statSync(pathAPIGATEWAY)

        if (!statsGRPC.isDirectory() || !statsAPI.isDirectory() || !statsAPIGATEWAY.isDirectory()) {
            throw new Error('Some of the directories is invalid')
        }

        return json

    }
}