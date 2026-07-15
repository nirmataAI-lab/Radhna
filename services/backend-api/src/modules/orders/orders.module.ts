import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { SocketAuthMiddleware } from './socket-auth.middleware';
import { PrismaModule } from '../../prisma/prisma.module';
import { CouponsModule } from '../coupons/coupons.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    CouponsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway, SocketAuthMiddleware],
})
export class OrdersModule {}
