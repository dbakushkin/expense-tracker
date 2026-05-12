import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { TransactionType } from '@prisma/client';
import type { TransactionPublic } from '@expence-tracker/shared-types';
import { GetCategoryByIdAndUserIdQuery } from '@/category/queries/get-category-by-id-and-user-id.query';
import { UpdateTransactionCommand } from '../update-transaction.command';
import { TransactionService } from '../../transaction.service';
import { TransactionMapper } from '../../transaction.mapper';

@CommandHandler(UpdateTransactionCommand)
export class UpdateTransactionHandler implements ICommandHandler<UpdateTransactionCommand, TransactionPublic> {
  constructor(
    private readonly service: TransactionService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(cmd: UpdateTransactionCommand): Promise<TransactionPublic> {
    if (cmd.data.categoryId != null) {
      await this.queryBus.execute(new GetCategoryByIdAndUserIdQuery(cmd.data.categoryId, cmd.userId));
    }

    const data: Record<string, unknown> = {};
    if (cmd.data.amount !== undefined) data['amount'] = cmd.data.amount;
    if (cmd.data.type !== undefined) data['type'] = cmd.data.type.toUpperCase() as TransactionType;
    if (cmd.data.description !== undefined) data['description'] = cmd.data.description;
    if (cmd.data.date !== undefined) data['date'] = new Date(cmd.data.date);
    if (cmd.data.categoryId !== undefined) data['categoryId'] = cmd.data.categoryId;

    const transaction = await this.service.update(cmd.id, cmd.userId, data as Parameters<TransactionService['update']>[2]);
    return TransactionMapper.toPublic(transaction);
  }
}
