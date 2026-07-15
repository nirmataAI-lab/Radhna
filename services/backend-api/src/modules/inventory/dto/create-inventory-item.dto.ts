import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Raw material name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unit of measurement (kg, l, pcs)' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ description: 'Current quantity in stock' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Threshold for low stock alerts' })
  @IsNumber()
  @Min(0)
  lowStockThreshold: number;

  @ApiPropertyOptional({ description: 'Supplier reference number' })
  @IsOptional()
  @IsString()
  supplierReference?: string;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ description: 'Raw material name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Unit of measurement (kg, l, pcs)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unit?: string;

  @ApiPropertyOptional({ description: 'Current quantity in stock' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Threshold for low stock alerts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Supplier reference number' })
  @IsOptional()
  @IsString()
  supplierReference?: string;
}
