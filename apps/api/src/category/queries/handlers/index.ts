import { GetCategoriesByUserIdHandler } from './get-categories-by-user-id.handler';
import { GetCategoryByIdAndUserIdHandler } from './get-category-by-id-and-user-id.handler';

export const QueryHandlers = [
  GetCategoriesByUserIdHandler,
  GetCategoryByIdAndUserIdHandler,
];
