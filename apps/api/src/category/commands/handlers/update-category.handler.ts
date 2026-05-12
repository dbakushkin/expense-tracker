import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CategoryPublic } from '@expence-tracker/shared-types';
import { CategoryService } from '@/category/category.service';
import { CategoryMapper } from '@/category/category.mapper';
import { UpdateCategoryCommand } from '../update-category.command';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler
  implements ICommandHandler<UpdateCategoryCommand, CategoryPublic>
{
  constructor(private readonly service: CategoryService) {}

  async execute(cmd: UpdateCategoryCommand): Promise<CategoryPublic> {
    const category = await this.service.update(cmd.id, cmd.userId, cmd.data);
    return CategoryMapper.toPublic(category);
  }
}
