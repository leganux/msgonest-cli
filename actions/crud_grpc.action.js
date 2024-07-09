let path = require('path')
let fs = require('fs')
let v = require('voca')
let _ = require('lodash');
let os = require('os');

const fsextra = require('fs-extra');

const {ensureFileExists, appendToEnd} = require('../function/common');

const defaultProtoFile = `syntax = 'proto3';
package events;
option go_package = './';
service EventsService {
// TODO: Remove next line
rpc test (EmptyRequest) returns (Error) {}

}

message EmptyRequest {}

//Error
message Error {
    string type = 1;
    string message = 2;
}

`

async function insertGRPCServices(filePath, newCode) {
    try {
        await ensureFileExists(filePath)
        // Read the .proto file
        let data = await fs.readFileSync(filePath, 'utf8');

        // Regular expression to find the last occurrence of any rpc statement
        const rpcPattern = /rpc\s+\w+\s*\([^)]*\)\s*returns\s*\([^)]*\)\s*{\s*}\s*/g;
        let lastMatchIndex = -1;
        let match;

        // Find the last match
        while ((match = rpcPattern.exec(data)) !== null) {
            lastMatchIndex = match.index + match[0].length;
        }

        if (lastMatchIndex !== -1) {
            // Insert the new code after the last match
            const newContent = data.slice(0, lastMatchIndex) + '\n' + newCode + data.slice(lastMatchIndex);

            // Write the file with the modified content
            await fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Code added successfully.');
        } else {
            console.log('No rpc statements found.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

let constructMessages = async function (fields, count = 2, isUpdate = false) {

    let fieldsStr = ''

    if (isUpdate) {
        fieldsStr = '\n string id = 1;'
    }

    for (let item of fields) {
        let type = ''
        let mandatory = ''

        if (item.kind == 'string') {
            type = 'string '
        }
        if (item.kind == 'boolean') {
            type = 'bool '
        }
        if (item.kind == 'int') {
            type = 'int32 '
        }
        if (item.kind == 'float') {
            type = 'float '
        }
        if (item.kind == 'double') {
            type = 'double '
        }
        if (!item.mandatory || isUpdate) {
            mandatory = ' optional '
        }
        if (isUpdate) {
            count++
        }

        fieldsStr = fieldsStr + ` \n  ${mandatory} ${type} ${item.name} = ${count};`
        count++
    }
    return fieldsStr

}

module.exports = async function (configJson, json) {
    try {
        let microserviceSnake = _.snakeCase(json.microservice)
        let microserviceCamel = _.camelCase(json.microservice)


        let namePascal = _.upperFirst(_.camelCase(json.name))

        let path_base = path.join(configJson.base_grpc_folder)
        await fsextra.ensureDirSync(path.join(path_base, microserviceCamel))
        let path_ms = path.join(path_base, microserviceCamel, microserviceCamel + '.proto')
        await ensureFileExists(path_ms, defaultProtoFile)

        let services = `\n //${_.capitalize(_.snakeCase(namePascal).replaceAll('_', ' '))} Services `
        let messages = `\n //${_.capitalize(_.snakeCase(namePascal).replaceAll('_', ' '))} Messages`

        let putGenericResponse = false

        let ms_type_default = `
    message ${namePascal}Data {
    string id = 1; 
    ${await constructMessages(json.fields)}
    }
    `
        messages = messages + `${ms_type_default}`
        messages = messages + `message ${namePascal}RequestById {
    string id = 1;
    }`

        if (json.ops.create) {
            services = services + `\n rpc Create${namePascal} (Create${namePascal}Request) returns (${namePascal}Response) {}`

            messages = messages + `\n message Create${namePascal}Request {${await constructMessages(json.fields, 1, false)} \n} `
            putGenericResponse = true

        }
        if (json.ops.update) {
            services = services + `\n rpc Update${namePascal} (Update${namePascal}Request) returns (${namePascal}Response) {}`

            messages = messages + `\n message Update${namePascal}Request {${await constructMessages(json.fields, 1, true)} \n} `
            putGenericResponse = true
        }
        if (json.ops.getOne) {
            services = services + `\n rpc Get${namePascal} (${namePascal}RequestById) returns (${namePascal}Response) {}`
            putGenericResponse = true
        }
        if (json.ops.delete) {
            services = services + `\n rpc Delete${namePascal} (${namePascal}RequestById) returns (Delete${namePascal}Response) {}`
            messages = messages + `\n message Delete${namePascal}Response {
        int32 status = 1;
        optional Error error = 2;
        optional string data = 3;
        } `
        }
        if (json.ops.list) {
            services = services + `\n rpc List${namePascal} (List${namePascal}Request) returns (List${namePascal}Response) {}`

            messages = messages + `\n message List${namePascal}Request {
        optional string query = 1;
        } `

            messages = messages + `\n message List${namePascal}Response {
        int32 status = 1;
        optional Error error = 2;
        repeated ${namePascal}Data data = 3;
        } `
        }

        if (putGenericResponse) {
            messages = messages + `\n message ${namePascal}Response {
        int32 status = 1;
        optional Error error = 2;
        optional ${namePascal}Data data = 3;
        } `
        }

        await appendToEnd(path_ms, messages)
        await insertGRPCServices(path_ms, services)

        console.log('GRPC Completed :)')
    } catch (e) {
        console.error(e)
        throw new Error('error when try to create GRPC', e)
    }
}
