import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CategoryService } from '@/category/category.service';
import { DeleteCategoryCommand } from '../delete-category.command';

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand, void> {
  constructor(private readonly service: CategoryService) {}

  async execute(cmd: DeleteCategoryCommand): Promise<void> {
    await this.service.delete(cmd.id, cmd.userId);
  }
}
