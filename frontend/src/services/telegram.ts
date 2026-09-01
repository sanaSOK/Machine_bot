import type { TelegramWebAppUser } from '../types/user';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

const PERMANENT_PERMISSION_KEY = 'attendance_permission_permanently_granted';

/**
 * Checks if permissions (Camera & Location) were authorized by the user.
 * Once granted, stays TRUE permanently across Android & iOS sessions.
 */
export function isPermissionGrantedPermanently(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PERMANENT_PERMISSION_KEY) === 'true';
}

/**
 * Marks Camera & Location permissions as permanently granted in persistent storage.
 */
export function markPermissionGrantedPermanently(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PERMANENT_PERMISSION_KEY, 'true');
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
      // Initialize Telegram LocationManager if supported
      if (tg.LocationManager && typeof tg.LocationManager.init === 'function') {
        try {
          tg.LocationManager.init();
        } catch (e) {
          console.warn('Telegram LocationManager.init warning:', e);
        }
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

/**
 * Requests location via Telegram Mini App LocationManager.
 * Optimized for Android Chrome WebViews and iOS Safari WebViews.
 */
export async function getTelegramLocation(): Promise<{ latitude: number; longitude: number }> {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.LocationManager) {
    const lm = window.Telegram.WebApp.LocationManager;
    return new Promise((resolve, reject) => {
      const fetchLocation = () => {
        try {
          lm.getLocation((data: any) => {
            if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
              markPermissionGrantedPermanently();
              resolve({ latitude: data.latitude, longitude: data.longitude });
            } else {
              fallbackStandardGeolocation(resolve, reject);
            }
          });
        } catch (err) {
          fallbackStandardGeolocation(resolve, reject);
        }
      };

      if (!lm.isInited) {
        try {
          lm.init(() => fetchLocation());
        } catch (e) {
          fetchLocation();
        }
      } else {
        fetchLocation();
      }
    });
  }

  return new Promise((resolve, reject) => {
    fallbackStandardGeolocation(resolve, reject);
  });
}

function fallbackStandardGeolocation(
  resolve: (res: { latitude: number; longitude: number }) => void,
  reject: (err: any) => void,
) {
  if (!navigator.geolocation) {
    return reject(new Error('Geolocation sensor is not supported by your device browser.'));
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      markPermissionGrantedPermanently();
      resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    },
    (err) => {
      reject(err);
    },
    {
      timeout: 10000,
      enableHighAccuracy: false, // Optimized for Android Chrome WebView to prevent repetitive location permission popups
      maximumAge: 30000,        // 30s cache prevents continuous Android sensor re-prompting
    },
  );
}

export function openTelegramLocationSettings(): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.LocationManager) {
    const lm = window.Telegram.WebApp.LocationManager;
    if (typeof lm.openSettings === 'function') {
      lm.openSettings();
    }
  }
}

export function closeTelegramApp(): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.close();
  }
}
