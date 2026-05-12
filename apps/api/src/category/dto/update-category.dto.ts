import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { UpdateCategoryRequest } from '@expence-tracker/shared-types';

export class UpdateCategoryDto implements UpdateCategoryRequest {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a hex string in #RRGGBB format' })
  color?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  icon?: string;
}
