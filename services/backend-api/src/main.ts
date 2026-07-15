import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import 'dotenv/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Create a .env file based on .env.example',
    );
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  // Limit incoming JSON payloads (including webhooks) to 1 MB
  app.useBodyParser('json', { limit: '1mb' });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // ─── Swagger / OpenAPI ────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Radhna Cuisine API')
    .setDescription(
      'Cloud Kitchen Management System — REST API for orders, menu, billing, and notifications.',
    )
    .setVersion('2.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication & user registration')
    .addTag('orders', 'Order management & tracking')
    .addTag('menu', 'Menu categories & food items')
    .addTag('billing', 'Payments & Razorpay integration')
    .addTag('tables', 'Restaurant table management')
    .addTag('inventory', 'Raw material inventory')
    .addTag('health', 'System health & monitoring')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, documentFactory);

  // ─── Security ─────────────────────────────────────
  app.use(helmet());
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      logger.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Backend API running on http://localhost:${port}/api`);
  logger.log(`📖 API Docs: http://localhost:${port}/api/docs`);
  logger.log(
    `🔒 Helmet enabled | Rate limiting active | CORS: ${allowedOrigins.length} origin(s)`,
  );
  logger.log(`🏥 Health endpoint: http://localhost:${port}/api/health`);
}
void bootstrap();
