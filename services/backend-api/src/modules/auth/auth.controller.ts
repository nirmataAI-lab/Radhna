import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description:
      'Authenticate with email and password. Returns JWT token and user profile.',
  })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Throttle({ short: { limit: 3, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({
    summary: 'Register',
    description:
      'Create a new customer account. Returns JWT token and user profile.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
