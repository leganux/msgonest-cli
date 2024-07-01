let path = require('path')
let fs = require('fs')
let v = require('voca')
let _ = require('lodash');
let { validateAndExtractJson ,ensureFileExists} = require('./../function/common')





async function constructMessages(arr, nameGeneral) {

    let messagesGeneral = ''
    let EnumGeneral = ''

    let grpcMessage = `\n   message ${v.capitalize(nameGeneral)} { \n`

    let requestCount = 1
    for (let jtem of arr) {

        let array = ''
        if (jtem.isArray) {
            array = ' repeated '
        }

        let optional = ''
        let name = v.camelCase(jtem.name)
        if (jtem.nullable) {
            optional = ' optional '
        }
        let type = ''
        if (jtem.type == 'object') {
            messagesGeneral = messagesGeneral + await constructMessages(jtem.children, jtem.name)
            type = v.capitalize(v.snakeCase(jtem.name))
        }
        else if (jtem.type == 'enum') {
            nameValue = v.capitalize(jtem.name)
            let innerEnum = `\n enum ${nameValue} { \n`
            let innerCounter = 0
            for (let kem of jtem.values) {
                innerEnum = innerEnum + `\n  ${v.upperCase(kem)}  = ${innerCounter} ;\n`
                innerCounter++
            }
            innerEnum = innerEnum + ' \n}'
            type = v.capitalize(jtem.name)
            EnumGeneral = EnumGeneral + innerEnum
        }
        else if (jtem.type == 'boolean') {
            type = 'bool'
        } else {
            type = v.lowerCase(jtem.type)
        }
        grpcMessage = grpcMessage + `\n  ${array} ${optional} ${type} ${name} = ${requestCount};\n `
        requestCount++
    }

    grpcMessage = grpcMessage + `\n   }\n`
    messagesGeneral = messagesGeneral + grpcMessage
    messagesGeneral = messagesGeneral + EnumGeneral
    return messagesGeneral
}

async function insertGRPCDynamicCode(filePath, newCode) {
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


async function insertGRPCDynamicCodeMessage(filePath, newCode) {
    try {
        await ensureFileExists(filePath)
        // Read the .proto file
        let data = await fs.readFileSync(filePath, 'utf8');
        const newContent = data + newCode

        await fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Code added successfully.');

    } catch (err) {
        console.error('Error:', err);
    }
}


let create = async function ({ path_ }) {


    let json = await validateAndExtractJson(path_[0])
    if (!json) {
        throw new Error('Error on reading json file')
    }




    let pathGRPC = path.resolve(json.base_grpc_folder)
    let statsGRPC = fs.statSync(pathGRPC)
    if (!statsGRPC.isDirectory()) {
        throw new Error('Some of the directories is invalid')
    }

    let microserviceLower = v.snakeCase(json.microservice)
    let grpcServiceFolder = path.join(pathGRPC, microserviceLower, microserviceLower + '.proto')
    for (let item of json.functions) {
        // creating GRPC Code
        let nameFunctionTitle = v.titleCase(item.name).replaceAll(' ', '')
        nameFunctionTitle = v.titleCase(nameFunctionTitle).replaceAll('_', '')

        let grpcCode = `\n  rpc ${nameFunctionTitle} (${nameFunctionTitle}Request) returns (${nameFunctionTitle}Response) {}\n`
        await insertGRPCDynamicCode(grpcServiceFolder, grpcCode)

        let messagesGeneral = ''
        let EnumGeneral = ''

        let grpcCodeRequest = `\n   message ${nameFunctionTitle}Request { \n`

        let requestCount = 1
        for (let jtem of item.fieldsRequest) {
            let optional = ''
            let name = v.camelCase(jtem.name)
            let array = ''
            if (jtem.isArray) {
                array = ' repeated '
            }
            if (jtem.nullable) {
                optional = ' optional '
            }
            let type = ''
            if (jtem.type == 'object') {
                messagesGeneral = messagesGeneral + await constructMessages(jtem.children, jtem.name)
                type = v.capitalize(jtem.name)
            }
            else if (jtem.type == 'enum') {
                nameValue = v.capitalize(jtem.name)
                let innerEnum = `\n enum ${nameValue} { \n`
                let innerCounter = 0
                for (let kem of jtem.values) {
                    innerEnum = innerEnum + `\n  ${v.upperCase(kem)}  = ${innerCounter} ;\n`
                    innerCounter++
                }

                innerEnum = innerEnum + ' \n}'
                type = v.capitalize(jtem.name)

                EnumGeneral = EnumGeneral + innerEnum
            }
            else {
                type = v.lowerCase(jtem.type)
            }
            grpcCodeRequest = grpcCodeRequest + `\n  ${array} ${optional} ${type} ${name} = ${requestCount};\n `
            requestCount++
        }
        grpcCodeRequest = grpcCodeRequest + `\n   }\n`

        let responseCount = 3
        let grpcCodeResponse = `\n   message ${nameFunctionTitle}Response { \n  int32 status = 1 ;  \n  optional Error error = 2; \n`
        for (let jtem of item.fieldsResponse) {
            let optional = ''
            let array = ''
            if (jtem.isArray) {
                array = ' repeated '
            }
            let name = v.camelCase(jtem.name)
            if (jtem.nullable) {
                optional = ' optional '
            }
            let type = ''
            if (jtem.type == 'object') {
                messagesGeneral = messagesGeneral + await constructMessages(jtem.children, jtem.name)
                type = v.capitalize(jtem.name)
            } else if (jtem.type == 'enum') {
                nameValue = v.capitalize(jtem.name)
                let innerEnum = `\n enum ${nameValue} { \n`
                let innerCounter = 0
                for (let kem of jtem.values) {
                    innerEnum = innerEnum + `\n  ${v.upperCase(kem)}  = ${innerCounter};\n`
                    innerCounter++
                }

                innerEnum = innerEnum + ' \n}'
                type = v.capitalize(jtem.name)

                EnumGeneral = EnumGeneral + innerEnum
            } else {
                type = v.lowerCase(jtem.type)
            }
            grpcCodeResponse = grpcCodeResponse + `\n  ${array} ${optional} ${type} ${name} = ${responseCount};\n `
            responseCount++
        }
        grpcCodeResponse = grpcCodeResponse + `\n   }\n`
        messagesGeneral = messagesGeneral + EnumGeneral
        messagesGeneral = messagesGeneral + grpcCodeRequest
        messagesGeneral = messagesGeneral + grpcCodeResponse
        await insertGRPCDynamicCodeMessage(grpcServiceFolder, messagesGeneral)
    }

}
module.exports = create