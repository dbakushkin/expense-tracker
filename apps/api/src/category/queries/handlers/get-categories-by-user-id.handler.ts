import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CategoryPublic } from '@expence-tracker/shared-types';
import { CategoryService } from '@/category/category.service';
import { CategoryMapper } from '@/category/category.mapper';
import { GetCategoriesByUserIdQuery } from '../get-categories-by-user-id.query';

@QueryHandler(GetCategoriesByUserIdQuery)
export class GetCategoriesByUserIdHandler
  implements IQueryHandler<GetCategoriesByUserIdQuery, CategoryPublic[]>
{
  constructor(private readonly service: CategoryService) {}

  async execute(query: GetCategoriesByUserIdQuery): Promise<CategoryPublic[]> {
    const categories = await this.service.findAllByUser(query.userId);
    return categories.map(CategoryMapper.toPublic);
  }
}
