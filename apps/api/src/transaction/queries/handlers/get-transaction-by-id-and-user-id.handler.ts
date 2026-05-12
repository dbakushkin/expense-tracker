import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { TransactionPublic } from '@expence-tracker/shared-types';
import { GetTransactionByIdAndUserIdQuery } from '../get-transaction-by-id-and-user-id.query';
import { TransactionService } from '../../transaction.service';
import { TransactionMapper } from '../../transaction.mapper';
import { TransactionNotFoundException } from '../../exceptions/transaction-not-found.exception';

@QueryHandler(GetTransactionByIdAndUserIdQuery)
export class GetTransactionByIdAndUserIdHandler implements IQueryHandler<GetTransactionByIdAndUserIdQuery, TransactionPublic> {
  constructor(private readonly service: TransactionService) {}

  async execute(query: GetTransactionByIdAndUserIdQuery): Promise<TransactionPublic> {
    const transaction = await this.service.findOneByIdAndUser(query.id, query.userId);
    if (!transaction) throw new TransactionNotFoundException();
    return TransactionMapper.toPublic(transaction);
  }
}
