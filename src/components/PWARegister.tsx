'use client';

import { useEffect } from 'react';

export function PWARegister() {
    useEffect(() => {
        // Register service worker
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const registerSW = async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                    });

                    console.log('[PWA] Service Worker registered successfully');

                    registration.addEventListener('updatefound', () => {
                        console.log('[PWA] Service Worker update found');
                    });
                } catch (error) {
                    console.error('[PWA] Service Worker registration failed:', error);
                }
            };

            registerSW();
        }
    }, []);

    // Render hidden div to prevent Next.js optimization stripping
    return <div data-pwa-register="true" style={{ display: 'none' }} />;
}
