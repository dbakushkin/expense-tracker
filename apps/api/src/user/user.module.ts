import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserService } from './user.service';
import { CommandHandlers } from './commands/handlers';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [CqrsModule],
  providers: [UserService, ...CommandHandlers, ...QueryHandlers],
})
export class UserModule {}
