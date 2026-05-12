import { describe, it, expect } from 'vitest';
import { registerSchema } from '../register.schema';

describe('registerSchema', () => {
  it('принимает корректные данные', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'Иван',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('отклоняет имя короче 2 символов', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'И',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('name');
  });

  it('отклоняет пароль короче 8 символов', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'Иван',
      password: 'short',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('password');
  });

  it('отклоняет пароль длиннее 72 символов', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'Иван',
      password: 'a'.repeat(73),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe('password');
  });
});
