import 'dotenv/config';
import { exec } from 'child_process';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import {
  ApiErrorResponseDto,
} from './common/dto/api-error-response.dto';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { applyStandardSwaggerResponses } from './common/swagger/apply-standard-responses';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');
  const port = Number(process.env.PORT ?? 3000);
  const apiPrefix = 'api/v1';
  const swaggerPath = 'api/docs';

  app.setGlobalPrefix(apiPrefix);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/media/',
  });

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL,
      process.env.ADMIN_PORTAL_URL,
    ].filter(Boolean) as string[],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Taleem AI CMS API')
    .setDescription('Alumni APIs first, then Admin APIs — grouped by functionality')
    .setVersion('1.0')
    .addBearerAuth()
    // Alumni (functionality order)
    .addTag('Alumni / Auth & Onboarding', 'Registration, activation, login, password reset')
    .addTag('Alumni / Profile & Career', 'Profile, professional, and academic self-service')
    .addTag('Alumni / Directory & Contacts', 'Alumni directory and contact requests')
    .addTag('Alumni / Events & RSVP', 'Browse events and manage RSVPs')
    .addTag('Alumni / Announcements', 'Published announcements feed')
    .addTag('Alumni / Catalog', 'Campuses, degrees, programs, and degree offerings')
    // Admin (functionality order)
    .addTag('Admin / Auth, Dashboard & Registrations', 'Admin login, dashboard stats, registration review')
    .addTag('Admin / Contact Requests', 'Approve or reject alumni contact requests')
    .addTag('Admin / Events', 'Create and manage events')
    .addTag('Admin / Announcements', 'Create and manage announcements')
    .addTag('Admin / Alumni Analytics', 'Alumni search, filters, and outreach export')
    .build();

  const document = applyStandardSwaggerResponses(
    SwaggerModule.createDocument(app, swaggerConfig, {
      extraModels: [ApiErrorResponseDto],
    }),
  );
  SwaggerModule.setup(swaggerPath, app, document);

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && req.path === '/') {
      return res.redirect(`/${swaggerPath}`);
    }
    return next();
  });

  await app.listen(port);

  const swaggerUrl = `http://localhost:${port}/${swaggerPath}`;
  logger.log(`Server running on http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger UI: ${swaggerUrl}`);
  logger.log(
    `Storage driver: ${(process.env.STORAGE_DRIVER ?? 'local').toLowerCase()}`,
  );

  if (process.env.OPEN_SWAGGER !== 'false') {
    openBrowser(swaggerUrl);
  }
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const command =
    platform === 'win32'
      ? `cmd /c start "" "${url}"`
      : platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(command, (error) => {
    if (error) {
      Logger.warn(`Could not open Swagger in browser: ${error.message}`);
    }
  });
}

bootstrap();
