import { describe, it, expect } from 'vitest';
import { loginSchema } from '../login.schema';

describe('loginSchema', () => {
  it('принимает корректные данные', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('отклоняет некорректный email', () => {
    const result = loginSchema.safeParse({ email: 'not-email', password: 'secret' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe('email');
  });

  it('отклоняет пустой пароль', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe('password');
  });
});
