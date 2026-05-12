import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import type { TransactionPublic } from '@expence-tracker/shared-types';
import { GetUserByIdQuery } from '@/user/queries/get-user-by-id.query';
import { GetCategoryByIdAndUserIdQuery } from '@/category/queries/get-category-by-id-and-user-id.query';
import { CreateTransactionCommand } from '../create-transaction.command';
import { TransactionService } from '../../transaction.service';
import { TransactionMapper } from '../../transaction.mapper';

@CommandHandler(CreateTransactionCommand)
export class CreateTransactionHandler implements ICommandHandler<CreateTransactionCommand, TransactionPublic> {
  constructor(
    private readonly service: TransactionService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(cmd: CreateTransactionCommand): Promise<TransactionPublic> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(cmd.userId));
    if (!user) throw new UnauthorizedException();

    if (cmd.data.categoryId != null) {
      await this.queryBus.execute(new GetCategoryByIdAndUserIdQuery(cmd.data.categoryId, cmd.userId));
    }

    const transaction = await this.service.create(cmd.userId, {
      amount: cmd.data.amount,
      type: cmd.data.type.toUpperCase() as TransactionType,
      description: cmd.data.description ?? null,
      date: new Date(cmd.data.date),
      categoryId: cmd.data.categoryId ?? null,
    });

    return TransactionMapper.toPublic(transaction);
  }
}
