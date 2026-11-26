import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

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
}
