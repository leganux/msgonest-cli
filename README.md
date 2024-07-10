# msgonest-cli

msgonest-cli is a command-line tool designed to eliminate boilerplate and repetitive code when generating the essential
files for a microservices project. It streamlines the process by automatically creating GRPC proto files, API
components (controller, service, and DTO), and Go code for the API gateway, based on a single JSON configuration file
provided by the user.

### Features

* GRPC Proto Files Generation: Automatically generate GRPC proto files to define service interfaces and message types.
* API Generation: Create API components, including controllers, services, and DTOs, to handle HTTP requests and
  responses.
* API Gateway Code Generation in Go: Generate Go code for the API gateway to manage and route incoming API requests.

### Usage

To use msgonest-cli, define a JSON configuration file that specifies the details of the microservice and the desired
components. Here is an example JSON configuration file with detailed explanations for each parameter and section:

### Example Json

```json 
{
  "name": "titok",
  "description": "tiktokurls",
  "microservice": "auth",
  "functions": [
    {
      "name": "get_tiktok_auth_url2",
      "enpoint": "/get_tiktok_auth_url2",
      "method": "GET",
      "needs_middleware": false,
      "fieldsRequest": [
        {
          "name": "user_id",
          "type": "string",
          // int32, float,double,string
          "nullable": true,
          "source": "query",
          "isUUID": true
        }
      ],
      "fieldsResponse": [
        {
          "name": "data",
          "type": "string",
          "nullable": false,
          "source": "response"
        }
      ]
    },
    {
      "name": "tiktok_auth_callback2",
      "enpoint": "/tiktok_auth_callback2",
      "method": "GET",
      "needs_middleware": true,
      "fieldsRequest": [
        {
          "name": "code",
          "type": "string",
          "nullable": true,
          "source": "body"
        },
        {
          "name": "state",
          "type": "string",
          "nullable": false,
          "source": "query"
        }
      ],
      "fieldsResponse": [
        {
          "name": "data",
          "type": "object",
          "nullable": false,
          "source": "response",
          "children": [
            {
              "name": "token",
              "type": "string",
              "nullable": false,
              "source": "response"
            },
            {
              "name": "tokenRefresh",
              "type": "string",
              "nullable": false,
              "source": "response"
            },
            {
              "name": "gender",
              "type": "enum",
              "values": [
                "Male",
                "Female",
                "Non_BINARY",
                "Not_APPLICABLE"
              ],
              "nullable": false,
              "source": "response"
            }
          ]
        }
      ]
    }
  ]
}

```

## JSON Configuration File Parameters

### General Information

* name: The name of the project or service. Example: "titok"
* description: A brief description of the project or service. Example: "tiktokurls"
* microservice: The name of the microservice. Example: "auth"
* functions: An array of function definitions that the microservice should handle.

### Function Definition Parameters

* name: The name of the function. Example: "get_tiktok_auth_url2"
* endpoint: The API endpoint for the function. Example: "/get_tiktok_auth_url2"
* method: The HTTP method for the API call (e.g., GET, POST). Example: "GET"
* needs_middleware: Boolean flag to indicate whether middleware is required for this function. Example: false

#### Request Fields

* fieldsRequest: An array of fields expected in the API request.

    * name: The name of the field. Example: "user_id"
    * type: The data type of the field (e.g., string, object). Example: "string"
    * nullable: Boolean flag to indicate if the field is nullable. Example: true
    * source: The source of the field in the request (e.g., query, body). Example: "query"
    * isUUID: Boolean flag to indicate if the field should be a UUID. Example: true
    * Response Fields
* fieldsResponse: An array of fields expected in the API response.
    * name: The name of the field. Example: "data"
    * type: The data type of the field (e.g., string, object). Example: "string"
    * nullable: Boolean flag to indicate if the field is nullable. Example: false
    * source: The source of the field in the response. Example: "response"
    * children: (Optional) An array of child fields if the field is an object.

### How to Use

Create a JSON Configuration File: Define the structure of your microservice and the necessary components using the JSON
format described above.

Run msgonest-cli: Execute the command-line tool, passing the JSON configuration file as an argument.

Generate Code: The tool will generate the specified components based on the provided configuration.
By using msgonest-cli, developers can significantly reduce the time spent on repetitive coding tasks and focus more on the
unique aspects of their microservices projects.

### Get started

## Install by Clone the repository

```bash
git clone https://github.com/leganux/msgonest-cli
 ```

Access to the repository

```bash
cd msgonest-cli
 ```

Install dependencies

```bash
npm i
 ```

link up the project to CLI, this create a simlink to execute the code as bash command

```bash
npm link
 ```

## Or Install  by NPM  Global

```bash
npm install -g msgonest_cli
 ```

### Configure (first time only)

Run config command to save the default project paths

```bash
msgonestcli config 
 ```

command request you for absolute paths for root projects of GRPC,API and Gateway. This configuration will be saved as
JSON file on

 ```txt
~/.msgonest_cli/config.js
 ```

Example config file

  ```json

{
  "base_grpc_folder": "/Users/leganux/Documents/GitHub/grpc/grpc",
  "base_API_folder": "/Users/leganux/Documents/GitHub/api",
  "base_API_GATEWAY_folder": "/Users/leganux/Documents/GitHub/api-gateway"
}

 ```

### Commands

#### full

Generates all code based on json template for GRPC,API and GATEWAY

```bash
msgonestcli full  -p /absolute/path/of/json/template.json
 ```

#### grpc

Generates all code based on json template for GRPC

```bash
msgonestcli grpc -p /absolute/path/of/json/template.json
 ```

#### gateway

Generates all code based on json template for GATEWAY

```bash
msgonestcli gateway -p /absolute/path/of/json/template.json
 ```

#### API

Generates all code based on json template for API

```bash
msgonestcli api -p /absolute/path/of/json/template.json
 ```

## How to create a new  microservices

Generates automatically the code for create a new microservice

```bash
msgonestcli microservice -n < ms_name > -p < [api,gateway,grpc,full] >
 ```

By default this command creates a microservice in full mode for all projects

## How to create a new  CRUD complete code based on JSON SCHEMA

Whit next functuin you can generate code for GRPC,Gateway and API for a completly CRUD

### Setp 1: Create a json as the example

```json
{
  "ops": {
    // which operations you will want to create
    "create": true,
    "getOne": true,
    "list": true,
    "delete": true,
    "update": true
  },
  "name": "EventTypes",
  // The CRUD name -- preserve "PascalCase"
  "description": "The types for events",
  "microservice": "events",
  // In wich microservice  will be added
  "fields": [
    // Wich fields you want to create, by default id, and dates will create automatically
    {
      "name": "name",
      "description": "Its the name of the type of event ",
      "kind": "string",
      "mandatory": true
    },
    {
      "name": "description",
      "description": "Its the description of the type of event ",
      "kind": "string",
      "mandatory": false
    },
    {
      "name": "enabled",
      "description": "If the row is active or not",
      "kind": "boolean",
      "mandatory": false,
      "default": true
    },
    {
      "name": "order",
      "description": "How be ordered in table or view",
      "kind": "int",
      "mandatory": false
    },
    {
      "name": "other",
      "description": "A custom float value",
      "kind": "float",
      "mandatory": false,
      "default": 0.0
    }
  ],
  "seed": [
    // optional uf you wanna create seed to preregister items
    {
      "name": "Music",
      "description": "Is a music event type",
      "enabled": true,
      "order": 1,
      "other": 1.23
    },
    {
      "name": "Opera",
      "description": "Is a opera event type",
      "enabled": true,
      "order": 2,
      "other": 2.22
    }
  ]
}



```

### Step2. Execute command

```bash
msgonestcli crud -p api  -j /Users/leganux/Documents/GitHub/msgonest-cli/crud.example.json
```

* -p Mandatory (In wih project will be executed [full,api,grpc,gateway])
* -j Mandatory The absolute full path of json definition file from the step behind

Once you have your Json file, Now its time to execute the command

<small> At the end you must to execute your code indentation and review and import dependencias</small>

## Notes

- The msgonest-cli covers approximately 95% of the necessary code for a microservices project. However, it is essential to
  manually validate that the code generation was executed successfully.

- We are currently working on improving indentation handling. For now, users will need to manually adjust the code
  formatting after running the CLI to ensure clean and structured code.

<hr>

<center>
msgonest-CLI is another project of Angel Erick Cruz all rights reserved
This project is distributed under the MIT license.
<br>
Special thanks to all developers that work for his contribution to this development.
<br>
The project was made with ♥️ by Angel Erick Cruz Olivera 



</center>
