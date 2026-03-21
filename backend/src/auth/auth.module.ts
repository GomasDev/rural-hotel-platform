import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
      UsersModule,
      ConfigModule,
      JwtModule.registerAsync({      
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          secret: config.get('JWT_SECRET'),
          signOptions: { expiresIn: '7d' },
        }),
      }),
    ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, ],
  exports: [AuthService],
})
export class AuthModule {}
