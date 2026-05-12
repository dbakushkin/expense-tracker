import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CategoryPublic, UserPublic } from '@expence-tracker/shared-types';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryCommand } from './commands/create-category.command';
import { UpdateCategoryCommand } from './commands/update-category.command';
import { DeleteCategoryCommand } from './commands/delete-category.command';
import { GetCategoriesByUserIdQuery } from './queries/get-categories-by-user-id.query';
import { GetCategoryByIdAndUserIdQuery } from './queries/get-category-by-id-and-user-id.query';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: UserPublic,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryPublic> {
    return this.commandBus.execute(
      new CreateCategoryCommand(user.id, dto.name, dto.color, dto.icon),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@CurrentUser() user: UserPublic): Promise<CategoryPublic[]> {
    return this.queryBus.execute(new GetCategoriesByUserIdQuery(user.id));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(
    @CurrentUser() user: UserPublic,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryPublic> {
    return this.queryBus.execute(new GetCategoryByIdAndUserIdQuery(id, user.id));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @CurrentUser() user: UserPublic,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryPublic> {
    return this.commandBus.execute(new UpdateCategoryCommand(id, user.id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: UserPublic,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteCategoryCommand(id, user.id));
  }
}
