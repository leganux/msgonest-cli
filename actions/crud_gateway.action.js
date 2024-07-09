const fsextra = require("fs-extra");
const {ensureFileExists, appendToEnd} = require("../function/common");

let path = require('path')
let fs = require('fs')
let v = require('voca')
let _ = require('lodash');
let os = require('os');


async function insertAPIGatewayRoutes(filePath, newCode) {
    await ensureFileExists(filePath)
    try {
        // Read the .proto file
        let data = await fs.readFileSync(filePath, 'utf8');

        data = data.replace('return svc', newCode + '\n return svc \n')

        await fs.writeFileSync(filePath, data, 'utf8');
    } catch (err) {
        console.error('Error:', err);
    }
}

module.exports = async function (configJson, json) {
    try {
        let microserviceSnake = _.snakeCase(json.microservice)
        let microserviceCamel = _.camelCase(json.microservice)
        let microservicePascal = _.upperFirst(_.camelCase(json.microservice))
        let microserviceLower = ((_.camelCase(json.microservice)).toLowerCase())
        let microserviceKebab = ((_.snakeCase(json.microservice)).replaceAll('_', '-'))

        let namePascal = _.upperFirst(_.camelCase(json.name))
        let nameCamel = (_.camelCase(json.name))
        let nameSnake = (_.snakeCase(json.name))
        let nameKebab = (_.snakeCase(json.name).replaceAll('_', '-'))
        let nameLower = ((_.camelCase(json.name)).toLowerCase())

        let path_base = path.join(configJson.base_API_GATEWAY_folder)
        await fsextra.ensureDirSync(path.join(path_base, microserviceCamel))

        let defaultFile = `
package ${nameLower}package

import (
	"github.com/gofiber/fiber/v2"
	config "rumor-api-gateway/pkg/common/configs"
	healthcheckroutes "rumor-api-gateway/pkg/common/health/routes"
	${microserviceLower}routes "rumor-api-gateway/pkg/${microserviceLower}/routes"
)

func RegisterRoutes(app *fiber.App, c config.Config) *ServiceClient {
	svc := InitServiceClient(&c)

	a := app.Group("/v1/${nameSnake}")
	
	return svc
}

`

        let baseForRoutes = `package ${microserviceLower}routes
import (
	"context"
	"github.com/gofiber/fiber/v2"
	"rumor-api-gateway/pkg/common/utils"
	protocol "rumor-api-gateway/pkg/${microserviceLower}/pb"
)
`

        let path_ms = path.join(path_base, 'pkg', microserviceCamel, 'routes.go')
        let path_ms_routes = path.join(path_base, 'pkg', microserviceCamel, 'routes')
        await ensureFileExists(path_ms, defaultFile)
        await fsextra.ensureDirSync(path_ms_routes)

        let strSVC = `\n //${_.capitalize(_.snakeCase(namePascal).replaceAll('_', ' '))} SVC's `
        let functions = `\n //${_.capitalize(_.snakeCase(namePascal).replaceAll('_', ' '))} Functions `


        if (json.ops.create) {
            strSVC = strSVC + `\n a.Post("/${nameKebab}", svc.Create${namePascal})`
            functions = functions + `\n func (svc *ServiceClient) Create${namePascal}(ctx *fiber.Ctx) error {
                return ${microserviceLower}routes.Create${namePascal}(ctx, svc.${microservicePascal}Client)
                }   `

            let fieldsRequest = ''
            let fieldsRequestSend = ''

            for (let item of json.fields) {
                let fieldKebab = (_.snakeCase(item.name).replaceAll('_', '-'))
                let fieldPascal = _.upperFirst(_.camelCase(item.name))
                let fieldSnake = _.snakeCase(item.name)

                let type = ''
                if (item.kind == 'string') {
                    type = 'string'
                }
                if (item.kind == 'boolean') {
                    type = 'bool'
                }
                if (item.kind == 'int') {
                    type = 'int32'
                }
                if (item.kind == 'float') {
                    type = 'float32'
                }
                if (item.kind == 'double') {
                    type = 'float64'
                }
                if (!item.mandatory) {
                    fieldSnake = fieldSnake + ',omitempty'
                    type = '*' + type
                }
                fieldsRequestSend = fieldsRequestSend + `\n${fieldPascal} :        body.${fieldPascal} ,`
                fieldsRequest = fieldsRequest + `\n ${fieldPascal}        ${type}  \`json:"${fieldSnake}"\``
            }

            let createRoute = baseForRoutes + `
            // Create${namePascal}Body
            // @Description	 Create ${json.description}
            type Create${namePascal}Body struct {
            ${fieldsRequest}
            }
            
            // Create${namePascal} godoc
            // @Summary		    endpoint for Create${namePascal}
            // @Description       This endpoint allows you to create a ${json.description}
            // @Tags			  ${microservicePascal}
            // @Accept		      json
            // @Produce		      json
            // @Param Request body	Create${namePascal}Body	true  "Request body parameters "
            // @Success		      200		  {object}	protocol.${namePascal}Response
            // @Failure		      400		  {object}	protocol.${namePascal}Response
            // @Router		      /${microserviceKebab}/${nameKebab}  [post]
            func Create${namePascal}(ctx *fiber.Ctx, c protocol.${microservicePascal}Client) error {
            body := Create${namePascal}Body{}
            if parseError := utils.ParseBody(ctx, &body); parseError != nil {
            return parseError
            }
            
            res, gatewayError := c.Create${namePascal}(context.Background(), &protocol.Create${namePascal}Request{
            ${fieldsRequestSend}
            })
            return utils.SendResponse(ctx, res, gatewayError)
            }

            `
            await appendToEnd(path.join(path_ms_routes, 'create_' + nameSnake + '.go'), createRoute)
        }
        if (json.ops.update) {
            strSVC = strSVC + `\n a.Put("/${nameKebab}/:id", svc.Update${namePascal})`
            functions = functions + `\n func (svc *ServiceClient) Update${namePascal}(ctx *fiber.Ctx) error {
                return ${microserviceLower}routes.Update${namePascal}(ctx, svc.${microservicePascal}Client)
                }  `

            let fieldsRequest = ''
            let fieldsRequestSend = ''

            for (let item of json.fields) {
                let fieldKebab = (_.snakeCase(item.name).replaceAll('_', '-'))
                let fieldPascal = _.upperFirst(_.camelCase(item.name))
                let fieldSnake = _.snakeCase(item.name)

                let type = ''
                if (item.kind == 'string') {
                    type = '*string'
                }
                if (item.kind == 'boolean') {
                    type = '*bool'
                }
                if (item.kind == 'int') {
                    type = '*int32'
                }
                if (item.kind == 'float') {
                    type = '*float32'
                }
                if (item.kind == 'double') {
                    type = '*float64'
                }

                fieldsRequestSend = fieldsRequestSend + `\n${fieldPascal} :        body.${fieldPascal} ,`
                fieldsRequest = fieldsRequest + `\n ${fieldPascal}        ${type}  \`json:"${fieldSnake},omitempty"\``
            }

            let updateRoute = baseForRoutes + `
            // Update${namePascal}Body
            // @Description	 Update ${json.description}
            type Update${namePascal}Body struct {
            ${fieldsRequest}
            }
            
            // Update${namePascal} godoc
            // @Summary		    endpoint for Update${namePascal}
            // @Description       This endpoint allows you to update a ${json.description}
            // @Tags			  ${microservicePascal}
            // @Accept		      json
            // @Produce		      json
            // @Param Request body	Update${namePascal}Body	true  "Request body parameters "
            // @Success		      200		  {object}	protocol.${namePascal}Response
            // @Failure		      400		  {object}	protocol.${namePascal}Response
            // @Router		      /${microserviceKebab}/${nameKebab}/{id}  [put]
            func Update${namePascal}(ctx *fiber.Ctx, c protocol.${microservicePascal}Client) error {
            body := Update${namePascal}Body{}
           
            
            if parseError := utils.ParseBody(ctx, &body); parseError != nil {
            return parseError
            }
            id := ctx.Params("id")
             
            res, gatewayError := c.Update${namePascal}(context.Background(), &protocol.Update${namePascal}Request{
            ${fieldsRequestSend}
            Id:          id,
            })
            return utils.SendResponse(ctx, res, gatewayError)
            }

            `
            await appendToEnd(path.join(path_ms_routes, 'update_' + nameSnake + '.go'), updateRoute)


        }
        if (json.ops.getOne) {
            strSVC = strSVC + `\n a.Get("/${nameKebab}/:id", svc.Get${namePascal})`
            functions = functions + `\n func (svc *ServiceClient) Get${namePascal}(ctx *fiber.Ctx) error {
                return ${microserviceLower}routes.Get${namePascal}(ctx, svc.${microservicePascal}Client)
                }    `

            let getOneRoute = baseForRoutes + `
            
           
            // Get${namePascal} godoc
            // @Summary		    endpoint for Get${namePascal}
            // @Description       This endpoint allows you to get one ${json.description}
            // @Tags			  ${microservicePascal}
            // @Accept		      json
            // @Produce		      json
            // @Param id  path  string  true  "The id param "
            // @Success		      200		  {object}	protocol.${namePascal}Response
            // @Failure		      400		  {object}	protocol.${namePascal}Response
            // @Router		      /${microserviceKebab}/${nameKebab}/{id}  [get]
            func Get${namePascal}(ctx *fiber.Ctx, c protocol.${microservicePascal}Client) error {
            
            id := ctx.Params("id")
             
            res, gatewayError := c.Get${namePascal}(context.Background(), &protocol.Create${namePascal}Request{
            Id:          id,
            })
            return utils.SendResponse(ctx, res, gatewayError)
            }

            `
            await appendToEnd(path.join(path_ms_routes, 'get_' + nameSnake + '.go'), getOneRoute)
        }
        if (json.ops.list) {
            strSVC = strSVC + `\n a.Get("/${nameKebab}", svc.List${namePascal})`
            functions = functions + `\n func (svc *ServiceClient) List${namePascal}(ctx *fiber.Ctx) error {
                return ${microserviceLower}routes.List${namePascal}(ctx, svc.${microservicePascal}Client)
                }    `


            let list = baseForRoutes + `
            
           
            // List${namePascal} godoc
            // @Summary		    endpoint for List${namePascal}
            // @Description       This endpoint allows you to get a list of ${json.description}
            // @Tags			  ${microservicePascal}
            // @Accept		      json
            // @Produce		      json
            // @Param        take    query     string  true  "Number of users to take for pagination"
            // @Param        skip    query     string  true  "Number of users to skip for pagination"
            // @Success		      200		  {object}	protocol.${namePascal}Response
            // @Failure		      400		  {object}	protocol.${namePascal}Response
            // @Router		      /${microserviceKebab}/${nameKebab}/  [get]
            func List${namePascal}(ctx *fiber.Ctx, c protocol.${microservicePascal}Client) error {
                query, parseError := utils.ParseQuery(ctx)
                if parseError != nil {
                    return parseError
                }
             
            res, gatewayError := c.List${namePascal}(context.Background(), &protocol.List${namePascal}Request{
            Query: &query,
            })
            return utils.SendResponse(ctx, res, gatewayError)
            }

            `
            await appendToEnd(path.join(path_ms_routes, 'list_' + nameSnake + '.go'), list)
        }
        if (json.ops.delete) {
            strSVC = strSVC + `\n a.Delete("/${nameKebab}/:id", svc.Delete${namePascal})`
            functions = functions + `\n func (svc *ServiceClient) Delete${namePascal}(ctx *fiber.Ctx) error {
                return ${microserviceLower}routes.Delete${namePascal}(ctx, svc.${microservicePascal}Client)
                }    `

            let deleteItem = baseForRoutes + `
            
           
            // Delete${namePascal} godoc
            // @Summary		    endpoint for Delete${namePascal}
            // @Description       This endpoint allows you to delete  an item of ${json.description}
            // @Tags			  ${microservicePascal}
            // @Accept		      json
            // @Produce		      json
            // @Param id  path  string  true  "The id param "
            // @Success		      200		  {object}	protocol.${namePascal}Response
            // @Failure		      400		  {object}	protocol.${namePascal}Response
            // @Router		      /${microserviceKebab}/${nameKebab}/{id}  [get]
            func Delete${namePascal}(ctx *fiber.Ctx, c protocol.${microservicePascal}Client) error {
                id := ctx.Params("id")
                 res, gatewayError := c.Delete${namePascal}(context.Background(), &protocol.Delete${namePascal}Request{
                    Id: id,
                 })
                return utils.SendResponse(ctx, res, gatewayError)
            }

            `
            await appendToEnd(path.join(path_ms_routes, 'delete_' + nameSnake + '.go'), deleteItem)
        }


        await appendToEnd(path_ms, functions)
        await insertAPIGatewayRoutes(path_ms, strSVC)
        console.log('GATEWAY Completed :)')
    } catch (e) {
        console.error(e)
        throw new Error('error when try to create GATEWAY', e)
    }
}
