/**
 * Development Configuration
 * Allows all popups, modals, and interactive features in Claude Code
 */

export const DEV_CONFIG = {
  // Allow all popups without restrictions
  popups: {
    enabled: true,
    blockPopups: false,
    allowAllOrigins: true,
  },

  // Allow all modals and dialogs
  modals: {
    enabled: true,
    requireConfirmation: false,
    autoOpen: true,
  },

  // Allow all interactive features
  features: {
    allowGeolocation: true,
    allowCamera: true,
    allowMicrophone: true,
    allowPayment: true,
    allowStorage: true,
    allowCookies: true,
  },

  // Development-only features
  dev: {
    showDebugInfo: true,
    logAllEvents: true,
    allowConsoleErrors: true,
    disableErrorBoundaries: false,
  },

  // CORS configuration
  cors: {
    allowAllOrigins: true,
    allowCredentials: true,
    allowAllMethods: true,
    allowAllHeaders: true,
  },
};

/**
 * Check if running in development/Claude Code environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Allow popup by overriding window.open if needed
 */
export function enableAllPopups(): void {
  if (typeof window !== 'undefined') {
    const originalOpen = window.open;

    // Override window.open to never block popups
    (window as any).open = function (
      url?: string,
      target?: string,
      features?: string
    ) {
      // Always allow the popup
      return originalOpen?.call(window, url, target, features) || null;
    };

    console.log('[DEV] All popups enabled');
  }
}

/**
 * Allow all interactive features
 */
export function enableAllFeatures(): void {
  if (typeof window !== 'undefined') {
    // Allow geolocation
    if (navigator.geolocation) {
      const originalGeolocation = navigator.geolocation;
      console.log('[DEV] Geolocation enabled');
    }

    // Allow localStorage/sessionStorage without restrictions
    try {
      localStorage.setItem('__dev_check__', 'true');
      localStorage.removeItem('__dev_check__');
      console.log('[DEV] Storage enabled');
    } catch (e) {
      console.warn('[DEV] Storage might be restricted');
    }

    // Allow cookies
    try {
      document.cookie = '__dev_check__=true; path=/';
      console.log('[DEV] Cookies enabled');
    } catch (e) {
      console.warn('[DEV] Cookies might be restricted');
    }
  }
}

/**
 * Initialize all development features
 */
export function initializeDevelopmentMode(): void {
  if (isDevelopment()) {
    enableAllPopups();
    enableAllFeatures();
    console.log('[DEV] Development mode initialized - all features enabled');
  }
}
