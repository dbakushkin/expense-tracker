import type { Transaction } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { TransactionPublic, TransactionSummary, TransactionType } from '@expence-tracker/shared-types';

export class TransactionMapper {
  static toPublic(t: Transaction): TransactionPublic {
    return {
      id: t.id,
      amount: t.amount.toString(),
      type: t.type.toLowerCase() as TransactionType,
      description: t.description,
      date: t.date.toISOString(),
      categoryId: t.categoryId,
      userId: t.userId,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  static toSummary(income: Prisma.Decimal, expense: Prisma.Decimal): TransactionSummary {
    return {
      income: income.toFixed(2),
      expense: expense.toFixed(2),
      balance: income.minus(expense).toFixed(2),
    };
  }
}
