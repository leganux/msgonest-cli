package {{___name_lower___}}package

import (
	healthcheckroutes "rumor-api-gateway/pkg/common/health/routes"
	{{___name_lower___}}routes "rumor-api-gateway/pkg/{{___name_lower___}}/routes"

	config "rumor-api-gateway/pkg/common/configs"

	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app *fiber.App, c config.Config) *ServiceClient {
	svc := InitServiceClient(&c)

	a := app.Group("/v1/{{___name_lower___}}")
	

	// Health check
	a.Get("/public/check-health", svc.CheckHealth)

	return svc
}

func (svc *ServiceClient) CheckHealth(ctx *fiber.Ctx) error {
	return healthcheckroutes.CheckHealth(ctx, svc.HealthClient)
}
