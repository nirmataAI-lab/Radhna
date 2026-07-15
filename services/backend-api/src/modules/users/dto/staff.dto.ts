import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateStaffDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(Role)
  role!: Extract<Role, 'SUPER_ADMIN' | 'CHIEF'>;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Extract<Role, 'SUPER_ADMIN' | 'CHIEF'>;

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'SUSPENDED';

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
