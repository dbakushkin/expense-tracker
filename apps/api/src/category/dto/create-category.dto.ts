import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { CreateCategoryRequest } from '@expence-tracker/shared-types';

export class CreateCategoryDto implements CreateCategoryRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a hex string in #RRGGBB format' })
  color!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  icon!: string;
}
