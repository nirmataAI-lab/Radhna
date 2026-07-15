import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

/**
 * Socket.io middleware that authenticates connections via JWT token
 * passed as a query parameter (token) during the WebSocket handshake.
 * Unauthenticated connections are rejected.
 */
@Injectable()
export class SocketAuthMiddleware {
  private readonly logger = new Logger('SocketAuth');

  constructor(private jwtService: JwtService) {}

  createMiddleware() {
    return (socket: Socket, next: (err?: Error) => void) => {
      try {
        const token =
          (socket.handshake.query.token as string) ||
          socket.handshake.auth?.token;

        if (!token) {
          this.logger.warn(
            `Connection rejected: no token provided (${socket.id})`,
          );
          return next(new Error('Unauthorized: No token provided'));
        }

        const payload = this.jwtService.verify(token);

        // Attach user data to socket for later use
        socket.data.user = {
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
        };

        this.logger.log(
          `Authenticated client: ${socket.id} (${payload.email})`,
        );
        next();
      } catch {
        this.logger.warn(`Connection rejected: invalid token (${socket.id})`);
        return next(new Error('Unauthorized: Invalid token'));
      }
    };
  }
}
