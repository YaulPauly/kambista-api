import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({ example: '65328d68-32d5-4881-b381-4ff2c4e1dec0' })
  id!: string;

  @ApiProperty({ example: 'USD' })
  monedaOrigen!: string;

  @ApiProperty({ example: 'PEN' })
  monedaDestino!: string;

  @ApiProperty({ example: 100 })
  monto!: number;

  @ApiProperty({ example: 373.9 })
  montoCambiado!: number;

  @ApiProperty({ example: 3.739 })
  tipoCambio!: number;

  @ApiProperty({ example: '2026-11-26T15:00:00.000Z' })
  fecha!: string;
}
