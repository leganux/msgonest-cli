let path = require('path')
let fs = require('fs')
let v = require('voca')
let _ = require('lodash');

let { validateAndExtractJson,ensureFileExists } = require('./../function/common')



async function insertPrivateMethodDynamicCodeAPI(filePath, newCode) {

    try {
        await ensureFileExists(filePath)
        // Read the file
        let data = await fs.readFileSync(filePath, 'utf8');

        // Regular expression to find the last occurrence of a public method
        const privateMethodPattern = /public\s+\w+\([^\)]*\):\s*Promise<[^\>]+>\s*\{[^}]*\}\s*/g;
        let lastMatchIndex = -1;
        let match;

        // Find the last match
        while ((match = privateMethodPattern.exec(data)) !== null) {
            lastMatchIndex = match.index + match[0].length;
        }

        if (lastMatchIndex !== -1) {
            // Insert the new code after the last match
            const newContent = data.slice(0, lastMatchIndex) + '\n' + newCode + data.slice(lastMatchIndex);

            // Write the file with the modified content
            await fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Code added successfully.');
        } else {
            console.log('No public methods found.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}


async function insertPrivateMethodDynamicCodeService(filePath, newCode) {
    try {

        await ensureFileExists(filePath)
        // Read the file
        let data = await fs.readFileSync(filePath, 'utf8');


        // Find the last occurrence of "}"
        const lastBraceIndex = data.lastIndexOf('}');

        if (lastBraceIndex !== -1) {
            // Insert the new code before the last "}"
            const newContent = data.slice(0, lastBraceIndex) + '\n' + newCode + data.slice(lastBraceIndex);

            // Write the file with the modified content
            await fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Code added successfully.');
        } else {
            console.log('No closing brace found.');
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


    let pathAPI = path.resolve(json.base_API_folder)
    let statsAPI = fs.statSync(pathAPI)
    if (!statsAPI.isDirectory()) {
        throw new Error('Some of the directories is invalid')
    }
    let codeController = ''
    let codeService = ''
    let codeDTOs = ''

    let serviceName = v.camelCase(json.microservice)
    let APIControllerFile = path.join(pathAPI, 'apps', serviceName, 'src', 'controllers', serviceName + '.controller.ts')

    let APIServiceFile = path.join(pathAPI, 'apps', serviceName, 'src', 'services', serviceName + '.service.ts')
    let APIDtoFile = path.join(pathAPI, 'apps', serviceName, 'src', 'dtos', serviceName + '.dto.ts')

    for (let item of json.functions) {
        let microserviceCap = (_.startCase(item.name)).replaceAll(' ', '')
        let microserviceCamel = (_.camelCase(item.name))
        codeController = codeController + `@GrpcMethod(${v.upperCase(json.microservice)}_SERVICE_NAME, '${microserviceCap}')
            public async ${microserviceCamel}(payload: ${microserviceCap}RequestDto): Promise<${microserviceCap}Response> {
            return this.service.${microserviceCamel}(payload);
            }\n`;
        codeService = codeService + `public async ${microserviceCamel}(payload: ${microserviceCap}RequestDto): Promise<${microserviceCap}Response> {
            try{
             return responses.ok
            }catch(err){
            this.logger.error(err);
            return responses.badRequest('Invalid SSO session redirect');
            }
            }\n`;
        let fieldsCode = ``
        for (let jtem of item.fieldsRequest) {
            let optional = ''
            let field = v.camelCase(jtem.name)
            if (jtem.nullable) {
                optional = '  @IsOptional() \n'
                field = field + '?: '
            } else {
                optional = ' @IsNotEmpty() \n'
                field = field + ': '
            }
            let type = ''
            if (jtem.type == 'string') {
                type = '  @IsString() \n'
                field = field + 'string'
            } else if (jtem.type.includes('int')) {
                type = '  @IsInt() \n'
                field = field + 'number'
            }
            else if (jtem.type == 'enum') {
                type = `  IsEnum(${_.startCase(jtem.name).replaceAll(' ', '')}) \n`
            }
            else if (jtem.type == 'float' || jtem.type == 'double') {
                type = '  @isNumber() \n'
                field = field + 'number'
            }
            if (item.isArray) {
                type = type + '  @IsArray() \n'
                field = field + '[]'
            }
            if (item.isUUID) {
                type = type + '  @IsUUID() \n'
            }
            field = field + '; \n';
            fieldsCode = fieldsCode + ` ${optional} ${type} ${field}`;

        }
        codeDTOs = codeDTOs + `export class ${microserviceCap}RequestDto implements ${microserviceCap}Request {   \n${fieldsCode}     }`

    }

    await insertPrivateMethodDynamicCodeService(APIControllerFile, codeController)
    await insertPrivateMethodDynamicCodeService(APIServiceFile, codeService)
    await insertGRPCDynamicCodeMessage(APIDtoFile, codeDTOs)


}

module.exports = create