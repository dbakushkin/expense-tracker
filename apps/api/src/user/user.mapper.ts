import type { User } from '@prisma/client';
import type { UserPublic } from '@expence-tracker/shared-types';

export class UserMapper {
  static toPublic(user: User): UserPublic {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
