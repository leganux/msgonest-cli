import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RumorEntities, SharedModule } from '@rumor/shared';
import { HealthController } from '@rumor/shared/health/grpc-health.controller';

import { {{___microservice_cap___}}Controller } from './controllers/{{___microservice_lower___}}.controller';
import { {{___microservice_cap___}}Service } from './services/{{___microservice_lower___}}.service';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        return {
          type: 'postgres',
          host: config.get<string>('POSTGRES_HOST'),
          port: config.get<number>('POSTGRES_PORT'),
          username: config.get<string>('POSTGRES_USERNAME'),
          password: config.get<string>('POSTGRES_PASSWORD'),
          database: config.get<string>('POSTGRES_DATABASE'),
          entities: [...RumorEntities],
          ssl:
            process.env.NODE_ENV === 'production'
              ? {
                  rejectUnauthorized: false, // this is temp for test server only
                }
              : false,
          synchronize: process.env.NODE_ENV === 'production' ? true : true,
          migrationsTransactionMode: 'each',
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([]),
    JwtModule.register({
      secret: process.env.JWT_TOKEN,
      signOptions: { expiresIn: '365d' },
    }),
    SharedModule,
  ],
  controllers: [{{___microservice_cap___}}Controller, HealthController],
  providers: [{{___microservice_cap___}}Service],
})
export class {{___microservice_cap___}}Module {}
