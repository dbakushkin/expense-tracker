import { ConflictException } from '@nestjs/common';

export class CategoryNameConflictException extends ConflictException {
  constructor() {
    super('Category name already in use');
  }
}
