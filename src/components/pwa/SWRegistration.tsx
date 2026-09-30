import { useEffect } from 'react';
import { Platform, View } from 'react-native';

/**
 * Registers the service worker for PWA support on web.
 * Only runs on web platform.
 */
export function SWRegistration() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Register the service worker after the page loads
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('SW registered:', registration.scope);

            // Check for updates periodically
            setInterval(() => {
              registration.update().catch(console.error);
            }, 60 * 60 * 1000); // Every hour

            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (
                    newWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    // New version available - show toast or reload
                    console.log('New version available!');
                    // Optionally: show update notification to user
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('SW registration failed:', error);
          });
      });

      // Listen for controller change (new SW took control)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    // Add manifest link if not present
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }

    // Add theme color meta tag
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#C5A059';
      document.head.appendChild(meta);
    }

    // Add apple-touch-icon if not present
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = '/apple-touch-icon.png';
      document.head.appendChild(link);
    }

    // Add apple-mobile-web-app-capable meta tag
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-capable';
      meta.content = 'yes';
      document.head.appendChild(meta);
    }

    // Add apple-mobile-web-app-status-bar-style meta tag
    if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-status-bar-style';
      meta.content = 'default';
      document.head.appendChild(meta);
    }

    // Add apple-mobile-web-app-title meta tag
    if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-title';
      meta.content = 'Cup & Co';
      document.head.appendChild(meta);
    }
  }, []);

  return <View style={{ flex: 0 }} />;
}