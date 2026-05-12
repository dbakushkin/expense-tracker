import { Injectable } from '@nestjs/common';
import { Prisma, Transaction, TransactionType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { TransactionNotFoundException } from './exceptions/transaction-not-found.exception';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    userId: string,
    data: {
      amount: number;
      type: TransactionType;
      description: string | null;
      date: Date;
      categoryId: string | null;
    },
  ): Promise<Transaction> {
    return this.prisma.transaction.create({ data: { ...data, userId } });
  }

  findOneByIdAndUser(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({ where: { id, userId } });
  }

  findAllByUser(userId: string, range?: { gte: Date; lt: Date }): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { userId, ...(range && { date: range }) },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async aggregateByUser(
    userId: string,
    range?: { gte: Date; lt: Date },
  ): Promise<{ income: Prisma.Decimal; expense: Prisma.Decimal }> {
    const rows = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, ...(range && { date: range }) },
      _sum: { amount: true },
    });
    const zero = new Prisma.Decimal(0);
    const income = rows.find((r) => r.type === 'INCOME')?._sum.amount ?? zero;
    const expense = rows.find((r) => r.type === 'EXPENSE')?._sum.amount ?? zero;
    return { income, expense };
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      amount: number;
      type: TransactionType;
      description: string | null;
      date: Date;
      categoryId: string | null;
    }>,
  ): Promise<Transaction> {
    const { count } = await this.prisma.transaction.updateMany({ where: { id, userId }, data });
    if (count === 0) throw new TransactionNotFoundException();
    return this.prisma.transaction.findFirst({ where: { id, userId } }) as Promise<Transaction>;
  }

  async delete(id: string, userId: string): Promise<void> {
    const { count } = await this.prisma.transaction.deleteMany({ where: { id, userId } });
    if (count === 0) throw new TransactionNotFoundException();
  }
}
