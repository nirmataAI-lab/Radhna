import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SocketAuthMiddleware } from './socket-auth.middleware';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict to frontend domains via env var
  },
})
export class OrdersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('OrdersGateway');

  constructor(
    private jwtService: JwtService,
    private socketAuthMiddleware: SocketAuthMiddleware,
  ) {}

  afterInit(server: Server) {
    // Apply JWT auth middleware to reject unauthenticated connections
    server.use(this.socketAuthMiddleware.createMiddleware());
    this.logger.log('Socket.io JWT authentication middleware initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(
      `Client connected: ${client.id} (${client.data.user?.email || 'unknown'})`,
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected: ${client.id} (${client.data.user?.email || 'unknown'})`,
    );
  }

  // Emits the order object to all authenticated connected clients
  broadcastNewOrder(order: any) {
    this.server.emit('newOrder', order);
  }

  // Emits order status updates to all authenticated connected clients
  broadcastOrderStatusUpdate(order: any) {
    this.server.emit('orderStatusUpdate', order);
  }
}
