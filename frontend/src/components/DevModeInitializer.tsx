'use client';

/**
 * Development Mode Initializer
 * Enables all popups, modals, and interactive features in Claude Code
 * Runs on client-side only
 */

import { useEffect } from 'react';
import { initializeDevelopmentMode, isDevelopment } from '@/config/development';

export default function DevModeInitializer() {
  useEffect(() => {
    // Initialize development mode to allow all popups and features
    if (isDevelopment()) {
      initializeDevelopmentMode();

      // Remove any popup blockers
      (window as any).open = window.open;

      // Allow all window features
      const originalOpen = window.open;
      (window as any).open = function (
        url?: string,
        target?: string,
        features?: string
      ) {
        console.log('[DEV] Opening popup:', { url, target, features });
        return originalOpen(url, target, features);
      };

      // Disable any modal blocking
      if (typeof document !== 'undefined') {
        // Allow all dialog elements
        const dialogElements = document.querySelectorAll('dialog');
        dialogElements.forEach((dialog) => {
          dialog.removeAttribute('data-disabled');
          dialog.style.display = 'block';
        });
      }

      console.log('🔓 Development Mode: All popups, modals, and features enabled');
    }
  }, []);

  // This component doesn't render anything
  return null;
}
