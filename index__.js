let path = require('path')
let fs = require('fs')
let v = require('voca')
let _ = require('lodash');



async function insertPrivateMethodDynamicCodeAPI(filePath, newCode) {
    try {
        // Read the file
        let data = await fs.readFileSync(filePath, 'utf8');

        // Regular expression to find the last occurrence of a private method
        const privateMethodPattern = /private\s+\w+\([^\)]*\):\s*Promise<[^\>]+>\s*\{[^}]*\}\s*/g;
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
            console.log('No private methods found.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}


async function insertPrivateMethodDynamicCodeService(filePath, newCode) {
    try {
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
        // Read the .proto file
        let data = await fs.readFileSync(filePath, 'utf8');
        const newContent = data + newCode

        await fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Code added successfully.');

    } catch (err) {
        console.error('Error:', err);
    }
}

async function exportRouteApi(path, name, fieldsRequest, microservice, method) {

    try {


        let generalFile = `package ${v.lowerCase(microservice)}routes
        import (
        "context"
        "github.com/gofiber/fiber/v2"
        protocol "rumor-api-gateway/pkg/${v.lowerCase(microservice)}/pb"
        "rumor-api-gateway/pkg/common/utils"
        )
    `;


        let body_params = fieldsRequest?.filter(item => item.source == 'body') || []
        let query_params = fieldsRequest?.filter(item => item.source == 'query') || []

        let serviceName = (_.startCase(name)).replaceAll(' ', '')

        let iner_body = ''
        let body_params_send = ''
        let body_func = ''
        let doc_body_func = ''

        if (body_params.length > 0) {

            iner_body = `// ${serviceName}Body
            // @Description	Request for checking user's age
            type ${serviceName}Body struct {
        `;

            for (let item of body_params) {
                let nameField = (_.startCase(item.name)).replaceAll(' ', '')
                let type = ''
                let optional = ''

                if (item.nullable) {
                    optional = ',omitempty'
                }
                if (item.type == 'object') {

                    type = nameField + 'Struct'
                }
                else if (item.type == 'enum') {
                    type = 'protocol.' + nameField
                } else {
                    type = v.lowerCase(item.type)
                }
                if (item.isArray) {
                    type = '[]' + type
                }
                if (optional != '') {
                    type = '*' + type
                }

                body_params_send = body_params_send + `${nameField}: body.${nameField}, \n`

                iner_body = iner_body + nameField + ' ' + type + ' `json:"' + _.camelCase(item.name) + optional + '"`   \n'
            }
            iner_body = iner_body + '  }';


            //body exist
            body_func = `body := ${serviceName}Body{}
            if parseError := utils.ParseBody(ctx, &body); parseError != nil {
            return parseError
            }
        `

            doc_body_func = `// @Param Request body	${serviceName}Body	true"Request body"`
        }

        let query_func = ''
        let doc_query_func = ''
        let query_params_send = ''
        if (query_params.length > 0) {
            for (let item of query_params) {
                let nameField = v.camelCase(item.name)
                let nameField_capitalize = _.startCase(item.name).replaceAll(' ', '')

                query_func = query_func + `${nameField} := ctx.Query("${nameField}") \n`;
                query_params_send = query_params_send + `${nameField_capitalize}: ${nameField},`
                doc_query_func = doc_query_func + ` // @Param ${nameField}  query  string  true  "The ${nameField} param "  `
            }
        }


        generalFile = generalFile + `
        ${iner_body}
        
        // ${serviceName} godoc
        // @Summary		    endpoint for ${serviceName}
        // @Description	    
        // @Tags			  Authentication
        // @Accept		      json
        // @Produce		      json
        ${doc_body_func}
        ${doc_query_func}
        // @Success		      200		  {object}	protocol.${serviceName}Response
        // @Failure		      400		  {object}	protocol.${serviceName}Response
        // @Router		      /${_.lowerCase(microservice)}/${serviceName}  [${_.lowerCase(method)}]
        func ${serviceName}(ctx *fiber.Ctx, c protocol.${_.capitalize(_.lowerCase(microservice))}ServiceClient) error {
            ${body_func} ${query_func}
        res, gatewayError := c.${serviceName}(context.Background(), &protocol.${serviceName}{
		${body_params_send} ${query_params_send}
        })
        return utils.SendResponse(ctx, res, gatewayError)
        }
        `;

        await fs.writeFileSync(path, generalFile, 'utf8');
        console.log('Created succesfull');


    } catch (e) {
        console.error(e)
        throw e
    }


}


async function insertAPIGatewayRoutes(filePath, newCode) {
    try {
        // Read the .proto file
        let data = await fs.readFileSync(filePath, 'utf8');

        data = data.replace('return svc', newCode + '\n return svc \n')

        await fs.writeFileSync(filePath, data, 'utf8');
    } catch (err) {
        console.error('Error:', err);
    }
}

async function insertAPIGatewayRoutesFunctions(filePath, newCode) {
    try {
        // Read the .proto file
        let data = await fs.readFileSync(filePath, 'utf8');
        data = data + newCode

        await fs.writeFileSync(filePath, data, 'utf8');
    } catch (err) {
        console.error('Error:', err);
    }
}

let create = async function (json) {
    console.log(json);

    // validate  paths 
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

    if (json.writeGRPC) {
        // GRPC

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

        // GRPC end
    }

    if (json.writeAPI_GATEWAY) {
        let microserviceLower = v.snakeCase(json.microservice)
        // API GATEWAY
        let APIGatewayServiceFolder = path.join(pathAPIGATEWAY, 'pkg', microserviceLower, 'routes')
        let APIGatewayServiceFile = path.join(pathAPIGATEWAY, 'pkg', microserviceLower, 'routes.go')

        let routes = '\n'
        let routes_functions = '\n'

        for (let item of json.functions) {
            let microservice = _.snakeCase(item.name)
            let microserviceCap = (_.startCase(item.name)).replaceAll(' ', '')
            await exportRouteApi(path.join(APIGatewayServiceFolder, microservice + '.go'), item.name, item.fieldsRequest, microserviceLower, item.method)

            let metod = v.capitalize(v.lowerCase(item.method))
            if (item.needs_middleware) {
                routes = routes + ` p.${metod}("${item.enpoint}", svc.${microserviceCap}) \n `;
            } else {
                routes = routes + ` a.${metod}("${item.enpoint}", svc.${microserviceCap}) \n `;
            }


            routes_functions = routes_functions + `func (svc *ServiceClient) ${microserviceCap}(ctx *fiber.Ctx) error {
            return ${v.camelCase(json.microservice)}routes.${microserviceCap}(ctx, svc.${_.startCase(json.microservice).replaceAll(' ', '')}Client)
            }
            `;
        }

        await insertAPIGatewayRoutes(APIGatewayServiceFile, routes)

        await insertAPIGatewayRoutesFunctions(APIGatewayServiceFile, routes_functions)

    }

    if (json.writeAPI) {

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
            private ${microserviceCamel}(payload: ${microserviceCap}RequestDto): Promise<${microserviceCap}Response> {
            return this.service.${microserviceCamel}(payload);
            }\n`;
            codeService = codeService + `private ${microserviceCamel}(payload: ${microserviceCap}RequestDto): Promise<${microserviceCap}Response> {
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

        await insertPrivateMethodDynamicCodeAPI(APIControllerFile, codeController)
        await insertPrivateMethodDynamicCodeService(APIServiceFile, codeService)
        await insertGRPCDynamicCodeMessage(APIDtoFile, codeDTOs)

    }













}

create(require('./test'))