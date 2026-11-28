import { ApiProperty } from '@nestjs/swagger';

export class ExchangeRateResponseDto {
  @ApiProperty({ example: 'USD' })
  monedaOrigen!: string;

  @ApiProperty({ example: 'PEN' })
  monedaDestino!: string;

  @ApiProperty({ example: 3.733 })
  compra!: number;

  @ApiProperty({ example: 3.739 })
  venta!: number;

  @ApiProperty({ example: 'SUNAT' })
  fuente!: string;

  @ApiProperty({ example: '2026-11-26T00:00:00.000Z' })
  fechaEfectiva!: string;

  @ApiProperty({ example: '2026-11-26T15:00:00.000Z' })
  consultadoEn!: string;
}
