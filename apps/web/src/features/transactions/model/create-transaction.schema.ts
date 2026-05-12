import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .string()
    .min(1, 'Укажите сумму')
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v.replace(',', '.')), 'Не более двух знаков после запятой')
    .refine((v) => Number(v.replace(',', '.')) >= 0.01, 'Минимум 0.01')
    .refine((v) => Number(v.replace(',', '.')) <= 99999999.99, 'Слишком большая сумма'),
  date: z.string().min(1, 'Укажите дату'),
  description: z.string().max(500, 'Максимум 500 символов').optional(),
  categoryId: z.string().optional(),
});

export type CreateTransactionFormValues = z.infer<typeof createTransactionSchema>;
