import { Injectable } from '@nestjs/common';
import { Prisma, Category } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CategoryNotFoundException } from './exceptions/category-not-found.exception';
import { CategoryNameConflictException } from './exceptions/category-name-conflict.exception';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    data: { name: string; color: string; icon: string },
  ): Promise<Category> {
    try {
      return await this.prisma.category.create({ data: { ...data, userId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new CategoryNameConflictException();
      }
      throw error;
    }
  }

  findAllByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  findOneByIdAndUser(id: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id, userId } });
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{ name: string; color: string; icon: string }>,
  ): Promise<Category> {
    try {
      const result = await this.prisma.category.updateMany({
        where: { id, userId },
        data,
      });
      if (result.count === 0) {
        throw new CategoryNotFoundException();
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new CategoryNameConflictException();
      }
      throw error;
    }
    return this.prisma.category.findFirst({ where: { id, userId } }) as Promise<Category>;
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.prisma.category.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
      throw new CategoryNotFoundException();
    }
  }
}
