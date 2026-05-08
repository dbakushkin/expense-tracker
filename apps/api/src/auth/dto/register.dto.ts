import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { RegisterRequest } from '@expence-tracker/shared-types';

export class RegisterDto implements RegisterRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
