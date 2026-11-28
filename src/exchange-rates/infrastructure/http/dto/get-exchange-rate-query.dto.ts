import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetExchangeRateQueryDto {
  @ApiProperty({ example: 'USD', description: 'Moneda de origen.' })
  @IsString({ message: 'La moneda de origen debe ser un texto.' })
  @IsNotEmpty({ message: 'La moneda de origen es obligatoria.' })
  monedaOrigen!: string;

  @ApiProperty({ example: 'PEN', description: 'Moneda de destino.' })
  @IsString({ message: 'La moneda de destino debe ser un texto.' })
  @IsNotEmpty({ message: 'La moneda de destino es obligatoria.' })
  monedaDestino!: string;
}
