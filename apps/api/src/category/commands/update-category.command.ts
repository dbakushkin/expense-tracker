import type { UpdateCategoryRequest } from '@expence-tracker/shared-types';

export class UpdateCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly data: UpdateCategoryRequest,
  ) {}
}
