import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AlumniModule } from '../alumni/alumni.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PasswordCryptoService } from './password-crypto.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(
          'JWT_SECRET',
          'taleem-dev-secret-change-me',
        ),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN', '8h') ??
            '8h') as `${number}h`,
        },
      }),
    }),
    forwardRef(() => AlumniModule),
  ],
  providers: [AuthService, JwtStrategy, PasswordCryptoService],
  exports: [AuthService, JwtModule, PassportModule, PasswordCryptoService],
})
export class AuthModule {}
