import { IsEmail, IsString, MinLength } from 'class-validator';
import { LoginRequest } from '@expence-tracker/shared-types';

export class LoginDto implements LoginRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
