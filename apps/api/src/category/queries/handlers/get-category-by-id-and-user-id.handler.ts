import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CategoryPublic } from '@expence-tracker/shared-types';
import { CategoryService } from '@/category/category.service';
import { CategoryMapper } from '@/category/category.mapper';
import { CategoryNotFoundException } from '@/category/exceptions/category-not-found.exception';
import { GetCategoryByIdAndUserIdQuery } from '../get-category-by-id-and-user-id.query';

@QueryHandler(GetCategoryByIdAndUserIdQuery)
export class GetCategoryByIdAndUserIdHandler
  implements IQueryHandler<GetCategoryByIdAndUserIdQuery, CategoryPublic>
{
  constructor(private readonly service: CategoryService) {}

  async execute(query: GetCategoryByIdAndUserIdQuery): Promise<CategoryPublic> {
    const category = await this.service.findOneByIdAndUser(query.id, query.userId);
    if (!category) {
      throw new CategoryNotFoundException();
    }
    return CategoryMapper.toPublic(category);
  }
}
