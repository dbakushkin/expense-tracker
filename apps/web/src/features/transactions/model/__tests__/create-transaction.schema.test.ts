import { describe, it, expect } from 'vitest';
import { createTransactionSchema } from '../create-transaction.schema';

const valid = {
  type: 'expense' as const,
  amount: '100.00',
  date: '2024-01-15',
  description: 'Обед',
  categoryId: undefined,
};

describe('createTransactionSchema', () => {
  describe('type', () => {
    it('принимает income', () => {
      const result = createTransactionSchema.safeParse({ ...valid, type: 'income' });
      expect(result.success).toBe(true);
    });

    it('принимает expense', () => {
      const result = createTransactionSchema.safeParse({ ...valid, type: 'expense' });
      expect(result.success).toBe(true);
    });

    it('отклоняет неизвестный тип', () => {
      const result = createTransactionSchema.safeParse({ ...valid, type: 'other' });
      expect(result.success).toBe(false);
    });
  });

  describe('amount', () => {
    it('принимает целое число', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: '100' });
      expect(result.success).toBe(true);
    });

    it('принимает число с точкой', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: '100.99' });
      expect(result.success).toBe(true);
    });

    it('принимает число с запятой (нормализация)', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: '1,5' });
      expect(result.success).toBe(true);
    });

    it('принимает граничный минимум 0.01', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: '0.01' });
      expect(result.success).toBe(true);
    });

    it('принимает граничный максимум 99999999.99', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: '99999999.99' });
      expect(result.success).toBe(true);
    });

    it('отклоняет 0.00', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: '0.00' });
      expect(result.success).toBe(false);
    });

    it('отклоняет отрицательное', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: '-1' });
      expect(result.success).toBe(false);
    });

    it('отклоняет сумму сверх максимума', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: '100000000' });
      expect(result.success).toBe(false);
    });

    it('отклоняет более двух знаков после запятой', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: '1.123' });
      expect(result.success).toBe(false);
    });

    it('отклоняет нечисловое значение', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: 'abc' });
      expect(result.success).toBe(false);
    });

    it('отклоняет пустую строку', () => {
      const result = createTransactionSchema.safeParse({ ...valid, amount: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('date', () => {
    it('принимает корректную дату YYYY-MM-DD', () => {
      const result = createTransactionSchema.safeParse({ ...valid, date: '2024-12-31' });
      expect(result.success).toBe(true);
    });

    it('отклоняет пустую строку', () => {
      const result = createTransactionSchema.safeParse({ ...valid, date: '' });
      expect(result.success).toBe(false);
    });

    it('отклоняет произвольный текст', () => {
      const result = createTransactionSchema.safeParse({ ...valid, date: 'вчера' });
      expect(result.success).toBe(false);
    });

    it('отклоняет дату в формате DD.MM.YYYY', () => {
      const result = createTransactionSchema.safeParse({ ...valid, date: '31.12.2024' });
      expect(result.success).toBe(false);
    });

    it('отклоняет ISO с временем', () => {
      const result = createTransactionSchema.safeParse({ ...valid, date: '2024-01-15T00:00:00Z' });
      expect(result.success).toBe(false);
    });
  });

  describe('description', () => {
    it('принимает без описания', () => {
      const result = createTransactionSchema.safeParse({ ...valid, description: undefined });
      expect(result.success).toBe(true);
    });

    it('принимает пустую строку', () => {
      const result = createTransactionSchema.safeParse({ ...valid, description: '' });
      expect(result.success).toBe(true);
    });

    it('отклоняет описание длиннее 500 символов', () => {
      const result = createTransactionSchema.safeParse({ ...valid, description: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });
});
