import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    example: 'USD',
    description: 'Moneda que entrega el usuario.',
  })
  @IsString({ message: 'La moneda de origen debe ser un texto.' })
  @IsNotEmpty({ message: 'La moneda de origen es obligatoria.' })
  monedaOrigen!: string;

  @ApiProperty({ example: 'PEN', description: 'Moneda que recibe el usuario.' })
  @IsString({ message: 'La moneda de destino debe ser un texto.' })
  @IsNotEmpty({ message: 'La moneda de destino es obligatoria.' })
  monedaDestino!: string;

  @ApiProperty({ example: 100, minimum: 0.01, maximum: 9999999.99 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe ser un número con máximo dos decimales.' },
  )
  @Min(0.01, { message: 'El monto debe ser mayor que cero.' })
  @Max(9999999.99, {
    message: 'El monto no puede superar 9,999,999.99.',
  })
  monto!: number;
}
