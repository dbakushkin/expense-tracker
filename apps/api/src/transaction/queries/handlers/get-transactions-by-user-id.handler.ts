import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import type { TransactionListResponse } from '@expence-tracker/shared-types';
import { GetTransactionsByUserIdQuery } from '../get-transactions-by-user-id.query';
import { TransactionService } from '../../transaction.service';
import { TransactionMapper } from '../../transaction.mapper';

@QueryHandler(GetTransactionsByUserIdQuery)
export class GetTransactionsByUserIdHandler implements IQueryHandler<GetTransactionsByUserIdQuery, TransactionListResponse> {
  constructor(private readonly service: TransactionService) {}

  async execute(query: GetTransactionsByUserIdQuery): Promise<TransactionListResponse> {
    const { userId, month, year } = query;

    if ((month != null && year == null) || (month == null && year != null)) {
      throw new BadRequestException('month and year must be provided together');
    }

    let range: { gte: Date; lt: Date } | undefined;
    if (month != null && year != null) {
      range = {
        gte: new Date(Date.UTC(year, month - 1, 1)),
        lt: new Date(Date.UTC(year, month, 1)),
      };
    }

    const [rows, { income, expense }] = await Promise.all([
      this.service.findAllByUser(userId, range),
      this.service.aggregateByUser(userId, range),
    ]);

    return {
      items: rows.map(TransactionMapper.toPublic),
      summary: TransactionMapper.toSummary(income, expense),
    };
  }
}
