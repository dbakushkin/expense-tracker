import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from '@prisma/client';
import { GetUserByEmailQuery } from '../get-user-by-email.query';
import { UserService } from '../../user.service';

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery, User | null> {
  constructor(private readonly userService: UserService) {}

  execute(query: GetUserByEmailQuery): Promise<User | null> {
    return this.userService.findByEmail(query.email);
  }
}
