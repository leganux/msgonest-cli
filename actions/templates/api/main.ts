import { INestMicroservice, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { protobufPackage as healthProtobufPackage } from '@rumor/shared/health/grpc/health/health.pb';
import { protobufPackage } from './grpc/{{___microservice_lower___}}/{{___microservice_lower___}}.pb';
import { LoggingInterceptor } from '@rumor/shared/middlewares/logger.middleware';
import { RpcExceptionFilter } from '@rumor/shared/filters/rpc-exception.filter';
import { {{___microservice_cap___}}Module } from './{{___microservice_lower___}}.module';

async function bootstrap() {
  const app: INestMicroservice = await NestFactory.createMicroservice({{___microservice_cap___}}Module, {
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:5005X', // TODO REPLACE THE PORT 
      package: [protobufPackage, healthProtobufPackage],
      protoPath: ['node_modules/rumor-grpc/grpc/{{___microservice_lower___}}/{{___microservice_lower___}}.proto', 'node_modules/rumor-grpc/grpc/health/health.proto'],
      loader: {
        defaults: true,
      },
    },
  });

  app.useGlobalInterceptors(new LoggingInterceptor({{___microservice_cap___}}Module.name));
  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen();
}

bootstrap();
