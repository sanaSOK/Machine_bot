import type { TelegramWebAppUser } from '../types/user';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;
}

export function initializeTelegram(): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    try {
      tg.ready();
      tg.expand();
      if (typeof tg.enableClosingConfirmation === 'function') {
        tg.enableClosingConfirmation();
      }
    } catch (e) {
      console.warn('Telegram WebApp initialize warning:', e);
    }
  }
}

export function getTelegramUser(): TelegramWebAppUser | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
}

export function getInitData(): string {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  return '';
}

/**
 * Waits for Telegram SDK script to load on mobile cellular networks
 */
export async function waitForTelegramSDK(maxWaitMs = 5000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

/**
 * Polls for Telegram WebApp initData to handle asynchronous injection on iOS/Android WebViews
 */
export async function waitForInitData(maxWaitMs = 5000): Promise<string> {
  await waitForTelegramSDK(maxWaitMs);
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    initializeTelegram();
    const initData = getInitData();
    if (initData) {
      return initData;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return getInitData();
}

export function closeTelegramApp(): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.close();
  }
}
