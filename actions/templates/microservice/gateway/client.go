package {{___name_lower___}}package

import (
	"fmt"

	config "rumor-api-gateway/pkg/common/configs"
	healthProtocol "rumor-api-gateway/pkg/common/health/pb"
	protocol "rumor-api-gateway/pkg/{{___name_lower___}}/pb"

	"google.golang.org/grpc"
)

type ServiceClient struct {
	{{___name_cap___}}Client protocol.{{___name_cap___}}ServiceClient
	HealthClient   healthProtocol.HealthClient
}

func InitServiceClient(c *config.Config) *ServiceClient {
	queryConnection, err := grpc.Dial(c.{{___name_cap___}}ServiceUrl, grpc.WithInsecure())

	if err != nil {
		fmt.Println("Could not connect:", err)
	}

	return &ServiceClient{
		{{___name_cap___}}Client: protocol.New{{___name_cap___}}ServiceClient(queryConnection),
		HealthClient:   healthProtocol.NewHealthClient(queryConnection),
	}
}
