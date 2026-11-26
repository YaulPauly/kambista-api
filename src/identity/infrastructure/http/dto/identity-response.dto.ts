import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../domain/enums/user-role.enum';

export class PublicUserResponseDto {
  @ApiProperty({ example: '65328d68-32d5-4881-b381-4ff2c4e1dec0' })
  id!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  nombre!: string;

  @ApiProperty({ example: 'juan@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  rol!: UserRole;
}

export class RegisterUserResponseDto {
  @ApiProperty({ type: PublicUserResponseDto })
  usuario!: PublicUserResponseDto;
}

export class LoginUserResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token!: string;

  @ApiProperty({ type: PublicUserResponseDto })
  usuario!: PublicUserResponseDto;
}
