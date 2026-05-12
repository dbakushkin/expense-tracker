import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { CommandHandlers } from './commands/handlers';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [CqrsModule],
  controllers: [TransactionController],
  providers: [TransactionService, ...CommandHandlers, ...QueryHandlers],
})
export class TransactionModule {}
