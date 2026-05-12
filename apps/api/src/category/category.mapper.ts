import type { Category } from '@prisma/client';
import type { CategoryPublic } from '@expence-tracker/shared-types';

export class CategoryMapper {
  static toPublic(category: Category): CategoryPublic {
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      userId: category.userId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
