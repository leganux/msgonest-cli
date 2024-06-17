let path = require('path')
let fs = require('fs')
let v = require('voca')
let _ = require('lodash');

let { validateAndExtractJson } = require('./../function/common')


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
        let serviceNameForLink = (_.lowerCase(name)).replaceAll(' ', '-')

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
        // @Router		      /${_.lowerCase(microservice)}/${serviceNameForLink}  [${_.lowerCase(method)}]
        func ${serviceName}(ctx *fiber.Ctx, c protocol.${_.capitalize(_.lowerCase(microservice))}ServiceClient) error {
            ${body_func} ${query_func}
        res, gatewayError := c.${serviceName}(context.Background(), &protocol.${serviceName}Request{
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

let create = async function ({ path_ }) {


    let json = await validateAndExtractJson(path_[0])
    if (!json) {
        throw new Error('Error on reading json file')
    }


    let pathAPIGATEWAY = path.resolve(json.base_API_GATEWAY_folder)

    let statsAPIGATEWAY = fs.statSync(pathAPIGATEWAY)


    if (!statsAPIGATEWAY.isDirectory()) {
        throw new Error('Some of the directories is invalid')
    }


    let microserviceLower = v.snakeCase(json.microservice)
    // API GATEWAY
    let APIGatewayServiceFolder = path.join(pathAPIGATEWAY, 'pkg', microserviceLower, 'routes')
    let APIGatewayServiceFile = path.join(pathAPIGATEWAY, 'pkg', microserviceLower, 'routes.go')

    let routes = '\n'
    let routes_functions = '\n'

    for (let item of json.functions) {
        let microservice = _.snakeCase(item.name)
        let microserviceCap = (_.startCase(item.name)).replaceAll(' ', '')
        let microserviceCapLink = (_.lowerCase(item.enpoint)).replaceAll(' ', '-').replaceAll('_', '-')
        await exportRouteApi(path.join(APIGatewayServiceFolder, microservice + '.go'), item.name, item.fieldsRequest, microserviceLower, item.method)

        let metod = v.capitalize(v.lowerCase(item.method))
        if (item.needs_middleware) {
            routes = routes + ` p.${metod}("${microserviceCapLink}", svc.${microserviceCap}) \n `;
        } else {
            routes = routes + ` a.${metod}("${microserviceCapLink}", svc.${microserviceCap}) \n `;
        }


        routes_functions = routes_functions + `func (svc *ServiceClient) ${microserviceCap}(ctx *fiber.Ctx) error {
            return ${v.camelCase(json.microservice)}routes.${microserviceCap}(ctx, svc.${_.startCase(json.microservice).replaceAll(' ', '')}Client)
            }
            `;
    }

    await insertAPIGatewayRoutes(APIGatewayServiceFile, routes)

    await insertAPIGatewayRoutesFunctions(APIGatewayServiceFile, routes_functions)




}

module.exports = create