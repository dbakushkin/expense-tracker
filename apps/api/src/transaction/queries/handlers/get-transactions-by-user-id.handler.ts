import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import type { TransactionListResponse } from '@expence-tracker/shared-types';
import { GetTransactionsByUserIdQuery } from '../get-transactions-by-user-id.query';
import { TransactionService } from '../../transaction.service';
import { TransactionMapper } from '../../transaction.mapper';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

@QueryHandler(GetTransactionsByUserIdQuery)
export class GetTransactionsByUserIdHandler implements IQueryHandler<GetTransactionsByUserIdQuery, TransactionListResponse> {
  constructor(private readonly service: TransactionService) {}

  async execute(query: GetTransactionsByUserIdQuery): Promise<TransactionListResponse> {
    const { userId, month, year } = query;
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

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

    const skip = (page - 1) * limit;

    const [rows, total, { income, expense }] = await Promise.all([
      this.service.findAllByUser(userId, range, { skip, take: limit }),
      this.service.countByUser(userId, range),
      this.service.aggregateByUser(userId, range),
    ]);

    return {
      items: rows.map(TransactionMapper.toPublic),
      summary: TransactionMapper.toSummary(income, expense),
      meta: TransactionMapper.toMeta(total, page, limit),
    };
  }
}
