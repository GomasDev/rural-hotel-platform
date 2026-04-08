import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { HotelsModule } from './hotels/hotels.module';
import { HikingRoutesModule } from './hiking-routes/hiking-routes.module';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }),
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      type: 'postgres',
      host: configService.get('DB_HOST'),
      port: parseInt(configService.get('DB_PORT')!, 10),
      username: configService.get('DB_USERNAME'),
      password: configService.get('DB_PASSWORD'),
      database: configService.get('DB_NAME'),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      migrations: ['src/migrations/*.ts'], 
      migrationsRun: false,
    }),
    inject: [ConfigService],
  }),
  AuthModule,
  UsersModule,
  HotelsModule,
  RoomsModule,
  RestaurantsModule,
  HikingRoutesModule,
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
