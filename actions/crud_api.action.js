const fsextra = require("fs-extra");
const {ensureFileExists, appendToEnd} = require("../function/common");

let path = require('path')
let fs = require('fs')
let v = require('voca')
let _ = require('lodash');
let os = require('os');


async function insertInReplace(filePath, newCode, find) {
    await ensureFileExists(filePath)
    try {
        // Read the .proto file
        let data = await fs.readFileSync(filePath, 'utf8');

        data = data.replace(find, newCode + '\n ' + find + ' \n')

        await fs.writeFileSync(filePath, data, 'utf8');
    } catch (err) {
        console.error('Error:', err);
    }
}

async function insertAtLastKey(filePath, newCode) {
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

        let path_base = path.join(configJson.base_API_folder)
        await fsextra.ensureDirSync(path.join(path_base, microserviceCamel))

        let defaultFile = ``

        let baseForRoutes = `package ${microserviceLower}routes
import (
	"context"
	"github.com/gofiber/fiber/v2"
	"rumor-api-gateway/pkg/common/utils"
	protocol "rumor-api-gateway/pkg/${microserviceLower}/pb"
)
`

        let path_app = path.join(path_base, 'apps', microserviceCamel, 'src')
        await fsextra.ensureDirSync(path_app)
        let path_controller = path.join(path_app, 'controllers', microserviceKebab + '.controller.ts')
        let path_service = path.join(path_app, 'services', microserviceKebab + '.service.ts')

        //Check if folder exist and define paths
        let path_seed_folder = path.join(path_app, 'database', 'seeders')
        await fsextra.ensureDirSync(path_seed_folder)
        let path_dtos = path.join(path_app, 'dtos', microserviceKebab + '.dto.ts')
        let path_entities = path.join(path_app, 'entities', nameKebab + '.entity.ts')
        let path_entities_folder = path.join(path_app, 'entities')
        await fsextra.ensureDirSync(path_entities_folder)

        //Check if files  exists and define paths
        await ensureFileExists(path_controller, '')
        await ensureFileExists(path_service, '')
        await ensureFileExists(path_dtos, '')
        await ensureFileExists(path_entities, '')


        let strController = `\n //${_.capitalize(_.snakeCase(namePascal).replaceAll('_', ' '))} Controller `
        let strService = `\n //${_.capitalize(_.snakeCase(namePascal).replaceAll('_', ' '))} Services `
        let strDto = `\n //${_.capitalize(_.snakeCase(namePascal).replaceAll('_', ' '))} DTo´s `
        let strEntity = `\n //${_.capitalize(_.snakeCase(namePascal).replaceAll('_', ' '))} Entity `


        strController = strController + `
        @GrpcMethod(${(microserviceSnake).toUpperCase()}_SERVICE_NAME, 'Create${namePascal}')
        public async create${namePascal}(payload: Create${namePascal}RequestDto): Promise<${namePascal}Response> {
        return this.${microserviceCamel}Service.create${namePascal}(payload);
        }
        
        @GrpcMethod(${(microserviceSnake).toUpperCase()}_SERVICE_NAME, 'List${namePascal}')
        public async list${namePascal}(payload: List${namePascal}RequestDto): Promise<List${namePascal}Response> {
        return this.${microserviceCamel}Service.list${namePascal}(payload);
        }
        
        @GrpcMethod(${(microserviceSnake).toUpperCase()}_SERVICE_NAME, 'Get${namePascal}')
        public async get${namePascal}(payload: ${namePascal}RequestByIdDto): Promise<${namePascal}Response> {
        return this.${microserviceCamel}Service.get${namePascal}(payload);
        }
        
        @GrpcMethod(${(microserviceSnake).toUpperCase()}_SERVICE_NAME, 'Update${namePascal}')
        public async update${namePascal}(payload: Update${namePascal}RequestDto): Promise<${namePascal}Response> {
         return this.${microserviceCamel}Service.update${namePascal}(payload);
         }
         
         @GrpcMethod(${(microserviceSnake).toUpperCase()}_SERVICE_NAME, 'Delete${namePascal}')
         public async delete${namePascal}(payload: ${namePascal}RequestByIdDto): Promise<Delete${namePascal}Response> {
         return this.${microserviceCamel}Service.delete${namePascal}(payload);
         }
        `
        await insertAtLastKey(path_controller, strController);


        strService = strService + `
        @InjectRepository(${namePascal})
            private readonly ${namePascal}Repository: Repository< ${namePascal} >;
            
        public async create${namePascal}(payload: Create${namePascal}RequestDto): Promise< ${namePascal}Response > {
          try {
                  const item = new ${namePascal}();
                  item.name = payload.name;
                  item.description = payload.description;
                  item.enabled = payload.enabled;
                  const created = await this.${namePascal}Repository.save(item);
          } catch (err) {
               this.logger.error(err);
                return responses.badRequest('Error at create item for ${namePascal}');
          }
        }
        
        public async list${namePascal}(payload: List${namePascal}RequestDto): Promise<List${namePascal}Response> {
            try {
                const parsedQuery = parse(payload.query);
                const pagination = hasPagination(parsedQuery)
                ? {
                take: parseInt(parsedQuery.take),
                skip: parseInt(parsedQuery.skip),
                }: {};
                
                const ${nameCamel}s = await this.${namePascal}Repository.find({ ...pagination });
                return responses.data(${nameCamel}s);
                
            } catch (err) {
                this.logger.error(err);
                return responses.badRequest('Error at get list of items of ${namePascal}');
                }
            }
            
        public async get${namePascal}(payload: ${namePascal}RequestByIdDto): Promise<${namePascal}Response> {
                try {
                    const ${nameCamel} = await this.${namePascal}Repository.findOne({ where: { id: payload.id } });
                    if (!${nameCamel}) {
                    return responses.notFound('Item ${namePascal}  not found');
                    }
                    return responses.data(${nameCamel});
                } catch (err) {
                    this.logger.error(err);
                    return responses.badRequest('Error at get an item  of ${namePascal}');
                }
            }
            public async delete${namePascal}(payload: ${namePascal}RequestByIdDto): Promise<Delete${namePascal}Response> {
                try {
                    const result = await this.${namePascal}Repository.delete(payload.id);
                    if (result.affected === 0) {
                    return responses.notFound('Item of ${namePascal} not found');
                    }
                    return responses.ok;
                } catch (err) {
                    this.logger.error(err);
                    return responses.badRequest('Error at delete an item for ${namePascal}');
                }
            }
            
            public async update${namePascal}(payload: Update${namePascal}RequestDto): Promise<${namePascal}Response> {
            try {
                const updateItem = {...payload};
                delete updateItem.id;
                await this.${namePascal}Repository.update({
                        id: payload.id
                    },
                    updateItem);
                const ${nameCamel} = await this.${namePascal}Repository.findOne({
                    where:
                        {
                            id: payload.id
                        }
                });
                if (!${nameCamel}) {
                    return responses.notFound("Item of ${namePascal} not found");
                }
                return responses.data(${nameCamel});
            } catch (err) {
                this.logger.error(err);
                return responses.badRequest("Error at update an item for ${namePascal}");
            }
            }           
        `
        await insertAtLastKey(path_service, strService);

        let FieldsForCreate = ''
        let FieldsForUpdate = ''
        let FieldsForEntyty = ''

        for (let item of json.fields) {
            let type = ''
            let type2 = ''
            let type3 = ''
            let mandatory = ''
            if (item.kind == 'string') {
                type = '\n @IsString()'
                type2 = ': string;'
                type3 = 'string'
            }
            if (item.kind == 'int' || item.kind == 'float' || item.kind == 'double') {
                type = '\n @IsNumber()'
                type2 = ': number;'
                type3 = 'number'
            }
            if (item.kind == 'boolean') {
                type = '\n @IsBoolean()'
                type2 = ': boolean;'
                type3 = 'boolean'
            }

            if (item.mandatory) {
                mandatory = '\n@IsNotEmpty()'
            } else {
                mandatory = '\n@IsOptional()'
                type2 = '?' + type2
            }
            FieldsForCreate = FieldsForCreate + `\n ${type}\n ${mandatory} \n ${_.camelCase(item.name)} ${type2} `
            FieldsForUpdate = FieldsForUpdate + `\n ${type}\n @IsOptional()\n ${_.camelCase(item.name)}?: ${type3}; `

            /* Aqui los campos del entity*/
            let typeEntity = ''
            let typeEntity2 = ''
            let nullable = ''
            let defaultValue = ''

            if (item.kind == 'string') {
                typeEntity = 'varchar'
                typeEntity2 = 'string'
            }
            if (item.kind == 'boolean') {
                typeEntity = 'boolean'
                typeEntity2 = 'boolean'
            }
            if (item.kind == 'int') {
                typeEntity = 'int'
                typeEntity2 = 'number'
            }
            if (item.kind == 'float') {
                typeEntity = 'float'
                typeEntity2 = 'number'
            }
            if (item.kind == 'double') {
                typeEntity = 'double'
                typeEntity2 = 'number'
            }
            if (item.default) {
                defaultValue = `default: "${item.default}",`
            }
            if (item.mandatory) {
                nullable = 'false'
            } else {
                nullable = "true"
            }

            FieldsForEntyty = FieldsForEntyty + ` 
              @Column({ type: '${typeEntity}', nullable: ${nullable}, ${defaultValue} name: '${_.camelCase(item.name)}' })
              ${_.camelCase(item.name)}: ${typeEntity2};
             
             `

        }

        strDto = strDto + `
        
        export class Create${namePascal}RequestDto implements Create${namePascal}Request {
        ${FieldsForCreate}
        }
        
        export class List${namePascal}RequestDto implements List${namePascal}Request {
        @IsOptional()
        @IsString()
        query?: string;
        }
        
        export class ${namePascal}RequestByIdDto implements ${namePascal}RequestById {
        @IsNotEmpty()
        @IsString()
        id: string;
        }
        
        export class Update${namePascal}RequestDto implements Update${namePascal}Request {
        @IsNotEmpty()
        @IsString()
        id: string;
          ${FieldsForUpdate}
        }
       
        `
        await appendToEnd(path_dtos, strDto)
        strEntity = strEntity + `
        
        import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
        
        @Entity()
        export class ${namePascal} extends BaseEntity {
        
        @PrimaryGeneratedColumn('uuid')
        id: string;
        
        ${FieldsForEntyty}
        
        @CreateDateColumn({
            type: 'timestamp',
            name: 'created_at',
            default: () => 'CURRENT_TIMESTAMP(6)',
        })
        createdAt: Date;
        
        @UpdateDateColumn({
            type: 'timestamp',
            name: 'updated_at',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
            default: () => 'CURRENT_TIMESTAMP(6)',
        })
        updatedAt: Date;
       
        
        @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
        deletedAt: Date | null;
        
 }
        `
        await appendToEnd(path_entities, strEntity)

        if (json.seed && Array.isArray(json.seed)) {
            let path_seed = path.join(path_app, 'database', 'seeders', nameKebab + '.seed.ts')
            await ensureFileExists(path_seed, '')

            let strSeed = `
            
            import { Injectable } from '@nestjs/common';
            import { InjectRepository } from '@nestjs/typeorm';
            import { Repository } from 'typeorm';
            import { ${namePascal} } from '../../entities/${nameKebab}.entity';
            
            @Injectable()
            export class SeedDatabase {
            constructor(
            @InjectRepository(${namePascal})
            private readonly ${nameCamel}Repository: Repository< ${namePascal} >,
            ) {}
             
             async seed() {
             const data_exists = await this.${nameCamel}Repository.find({ take: 1 });
             if (data_exists.length < 1) {
             const data = ${JSON.stringify(json.seed, null, '\t')};
             await this.${nameCamel}Repository.save(data);
             }
             }
             }
            `
            appendToEnd(path_seed, strSeed)
        }


        console.log('API Completed :)')
        console.log('Dont forget APPLY import and run Proto generator files')
    } catch (e) {
        console.error(e)
        throw new Error('error when try to create GATEWAY', e)
    }
}
