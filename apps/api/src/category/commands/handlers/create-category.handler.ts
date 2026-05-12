import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { CategoryPublic } from '@expence-tracker/shared-types';
import { GetUserByIdQuery } from '@/user/queries/get-user-by-id.query';
import { CategoryService } from '@/category/category.service';
import { CategoryMapper } from '@/category/category.mapper';
import { CreateCategoryCommand } from '../create-category.command';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler
  implements ICommandHandler<CreateCategoryCommand, CategoryPublic>
{
  constructor(
    private readonly service: CategoryService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(cmd: CreateCategoryCommand): Promise<CategoryPublic> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(cmd.userId));
    if (!user) {
      throw new UnauthorizedException();
    }
    const category = await this.service.create(cmd.userId, {
      name: cmd.name,
      color: cmd.color,
      icon: cmd.icon,
    });
    return CategoryMapper.toPublic(category);
  }
}
