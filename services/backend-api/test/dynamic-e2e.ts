import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import * as fs from 'fs';

async function runE2E() {
  console.log('Starting Dynamic E2E Test Suite...');
  
  // 1. Boot Application
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const server = app.getHttpServer();
  await app.init();
  
  // 2. Load Swagger Map
  const map = JSON.parse(fs.readFileSync('./endpoint_map.json', 'utf8'));
  const paths = map.paths;
  const totalEndpoints = Object.keys(paths).length;
  console.log(`Discovered ${totalEndpoints} endpoint paths.`);

  let passed = 0;
  let failed = 0;
  
  // 3. Fuzzing Payloads
  const invalidPayload = { injected: "'; DROP TABLE users; --" };
  const largePayload = { data: 'A'.repeat(2 * 1024 * 1024) }; // 2MB

  // 4. Test execution
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method] of Object.entries(methods as Record<string, any>)) {
      // Normalize path parameters e.g. /users/{id} -> /users/1
      const testPath = path.replace(/\{([^}]+)\}/g, '1');
      
      console.log(`\nTesting: [${method.toUpperCase()}] ${testPath}`);
      
      try {
        const req = request(server)[method](testPath);
        
        // 4.1 Missing Token Test
        const noTokenRes = await req.send();
        if (noTokenRes.status >= 500) {
           console.log(`❌ FAILED (500 Error): [${method.toUpperCase()}] ${testPath}`);
           failed++;
           continue;
        }

        // 4.2 Large Payload Fuzzing
        if (['post', 'put', 'patch'].includes(method)) {
          const largeReq = request(server)[method](testPath).send(largePayload);
          const largeRes = await largeReq;
          if (largeRes.status === 413 || largeRes.status === 400 || largeRes.status === 401) {
             // Passed validation bounds
          } else if (largeRes.status >= 500) {
             console.log(`❌ FAILED (Large Payload 500 Error): [${method.toUpperCase()}] ${testPath}`);
             failed++;
             continue;
          }
        }
        
        // 4.3 Invalid Body Fuzzing
        if (['post', 'put', 'patch'].includes(method)) {
          const fuzzReq = request(server)[method](testPath).send(invalidPayload);
          const fuzzRes = await fuzzReq;
          if (fuzzRes.status >= 500) {
             console.log(`❌ FAILED (Invalid Body 500 Error): [${method.toUpperCase()}] ${testPath}`);
             failed++;
             continue;
          }
        }

        console.log(`✅ PASSED: [${method.toUpperCase()}] ${testPath}`);
        passed++;
        
      } catch (err) {
        console.error(`❌ FAILED (Exception): [${method.toUpperCase()}] ${testPath}`, err);
        failed++;
      }
    }
  }

  console.log('\n--- Final E2E Report ---');
  console.log(`Total Tested: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  fs.writeFileSync('e2e_results.json', JSON.stringify({ passed, failed, total: passed+failed }));
  await app.close();
  process.exit(failed > 0 ? 1 : 0);
}

runE2E().catch(console.error);
