let json = {
    "name": "titok",
    "description": "tiktokurls",
    "microservice": "auth",
    "base_grpc_folder": "/Users/leganux/Documents/GitHub/grpc/grpc",
    "base_API_folder": "/Users/leganux/Documents/GitHub/api",
    "base_API_GATEWAY_folder": "/Users/leganux/Documents/GitHub/api-gateway",
    "writeGRPC": false,
    "writeAPI": true,
    "writeAPI_GATEWAY": false,
    "functions": [
        {
            "name": "get_tiktok_auth_url2",
            "enpoint": "/get_tiktok_auth_url2",
            "method": "GET",
            "needs_middleware": false,
            "fieldsRequest": [
                {
                    "name": "user_id",
                    "type": "string", // int32, float,double,string
                    "nullable": true,
                    "source": "query",
                    "isUUID":true
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
                }, {
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
                        }, {
                            "name": "gender",
                            "type": "enum",
                            "values": ["Male", "Female", "Non_BINARY", "Not_APPLICABLE"],
                            "nullable": false,
                            "source": "response"
                        }
                    ]
                }
            ]
        }
    ]
}

module.exports = json