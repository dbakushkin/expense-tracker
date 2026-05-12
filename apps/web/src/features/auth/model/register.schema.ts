import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  password: z.string().min(8, 'Минимум 8 символов').max(72, 'Максимум 72 символа'),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Необходимо принять соглашение' }),
  }),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
