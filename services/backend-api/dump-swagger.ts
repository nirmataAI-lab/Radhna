import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './src/app.module';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder().build();
  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('endpoint_map.json', JSON.stringify(document, null, 2));
  await app.close();
}
bootstrap();
