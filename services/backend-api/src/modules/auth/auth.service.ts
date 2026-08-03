import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private get refreshSecret(): string {
    const s = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!s) throw new Error('JWT_REFRESH_SECRET is not configured');
    return s;
  }

  private issueTokens(user: {
    id: string;
    email: string | null;
    role: string;
  }) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TTL,
    });
    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { secret: this.refreshSecret, expiresIn: REFRESH_TTL },
    );
    return { access_token, refresh_token };
  }

  private publicUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(pass, user.passwordHash))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: any) {
    return { ...this.issueTokens(user), user: this.publicUser(user) };
  }

  async register(dto: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const user = await this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      role: Role.CUSTOMER,
      phone: dto.phone,
    });
    return { ...this.issueTokens(user), user: this.publicUser(user) };
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload?.type !== 'refresh' || !payload?.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return { ...this.issueTokens(user), user: this.publicUser(user) };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal user existence
      return { message: 'If that email is registered, password reset instructions have been sent.' };
    }
    // Generate 6-digit reset token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await this.usersService.setResetToken(user.id, token, expiry);
    const response: Record<string, string> = {
      message: 'If that email is registered, password reset instructions have been sent.',
    };
    // Only expose token in non-production for dev/test purposes
    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = token;
    }
    return response;
  }

  async resetPassword(token: string, newPassword: string) {
    const success = await this.usersService.resetPassword(token, newPassword);
    if (!success) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    return { message: 'Password reset successfully' };
  }
}
