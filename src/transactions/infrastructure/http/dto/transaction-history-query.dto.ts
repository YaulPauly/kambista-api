import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class TransactionHistoryQueryDto {
  @ApiProperty({ example: '2026-11-01', description: 'Fecha inicial.' })
  @IsDateString({}, { message: 'startDate debe ser una fecha válida.' })
  startDate!: string;

  @ApiProperty({ example: '2026-11-30', description: 'Fecha final.' })
  @IsDateString({}, { message: 'endDate debe ser una fecha válida.' })
  endDate!: string;

  @ApiPropertyOptional({
    example: '50432706-048a-44ca-b04e-b2707ee928b4',
    description: 'Solo puede ser utilizado por un administrador.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'userId debe ser un UUID válido.' })
  userId?: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'page debe ser un número entero.' })
  @Min(1, { message: 'page debe ser mayor que cero.' })
  page = 1;

  @ApiPropertyOptional({ example: 12, default: 12, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'pageSize debe ser un número entero.' })
  @Min(1, { message: 'pageSize debe ser mayor que cero.' })
  @Max(100, { message: 'pageSize no puede superar 100.' })
  pageSize = 12;
}
