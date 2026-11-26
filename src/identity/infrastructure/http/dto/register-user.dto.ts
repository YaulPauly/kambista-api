import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del usuario.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'Contraseña123',
    minLength: 8,
    maxLength: 72,
    writeOnly: true,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
