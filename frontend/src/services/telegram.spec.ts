import { describe, it, expect, beforeEach } from 'vitest';
import { getTelegramUser, getInitData, isTelegramWebApp } from './telegram';

describe('Telegram Service Wrapper', () => {
  beforeEach(() => {
    delete (window as any).Telegram;
  });

  it('should return false for isTelegramWebApp when Telegram window object is missing', () => {
    expect(isTelegramWebApp()).toBe(false);
  });

  it('should return empty string for initData when Telegram object is missing', () => {
    expect(getInitData()).toBe('');
  });

  it('should return null for getTelegramUser when Telegram object is missing', () => {
    expect(getTelegramUser()).toBeNull();
  });

  it('should return correct initData when Telegram WebApp is initialized', () => {
    (window as any).Telegram = {
      WebApp: {
        initData: 'query_id=123&user=%7B%22id%22%3A100%7D&hash=abc',
        initDataUnsafe: {
          user: { id: 100, first_name: 'TestUser' },
        },
        ready: () => {},
        expand: () => {},
      },
    };

    expect(isTelegramWebApp()).toBe(true);
    expect(getInitData()).toBe('query_id=123&user=%7B%22id%22%3A100%7D&hash=abc');
    expect(getTelegramUser()).toEqual({ id: 100, first_name: 'TestUser' });
  });
});
