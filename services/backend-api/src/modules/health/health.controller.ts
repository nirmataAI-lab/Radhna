import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';

@Controller('health')
export class HealthController {
  private readonly startTime: number = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Get()
  async check() {
    const checks: Record<string, any> = {};
    let healthy = true;

    // Database health
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'up' };
    } catch (err: any) {
      checks.database = { status: 'down', error: err.message };
      healthy = false;
    }

    // Uptime
    const uptime = Date.now() - this.startTime;

    const response = {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    };

    if (!healthy) {
      this.logger.warn('Health check failed', response);
    }

    return response;
  }
}
