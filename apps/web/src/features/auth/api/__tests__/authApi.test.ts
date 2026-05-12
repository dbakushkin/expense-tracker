import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('authApi', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('login', () => {
    it('делает POST /api/auth/login и возвращает user при успехе', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        createdAt: '',
        updatedAt: '',
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: mockUser }), { status: 200 }),
      );

      const { authApi } = await import('../authApi');
      const result = await authApi.login({ email: 'user@example.com', password: 'pass' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com', password: 'pass' }),
        }),
      );
      expect(result).toEqual({ user: mockUser });
    });

    it('бросает ошибку со status 401 при неверных данных', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 }),
      );

      const { authApi } = await import('../authApi');
      await expect(
        authApi.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toMatchObject({ message: 'Invalid credentials', status: 401 });
    });
  });

  describe('register', () => {
    it('делает POST /api/auth/register и возвращает user при успехе', async () => {
      const mockUser = {
        id: '2',
        email: 'new@example.com',
        name: 'Новый',
        createdAt: '',
        updatedAt: '',
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: mockUser }), { status: 201 }),
      );

      const { authApi } = await import('../authApi');
      const result = await authApi.register({
        email: 'new@example.com',
        name: 'Новый',
        password: 'password1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual({ user: mockUser });
    });

    it('бросает ошибку со status 409 при дублирующем email', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Email already in use' }), { status: 409 }),
      );

      const { authApi } = await import('../authApi');
      await expect(
        authApi.register({
          email: 'dup@example.com',
          name: 'User',
          password: 'password1',
        }),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('logout', () => {
    it('делает POST /api/auth/logout', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

      const { authApi } = await import('../authApi');
      await authApi.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
