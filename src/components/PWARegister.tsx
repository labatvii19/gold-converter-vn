'use client';

import { useEffect } from 'react';

export function PWARegister() {
    useEffect(() => {
        // Check if service worker is supported
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Register service worker
            const registerSW = async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                    });

                    console.log('[PWA] Service Worker registered successfully');
                    console.log('[PWA] Scope:', registration.scope);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        console.log('[PWA] Service Worker update found');
                    });
                } catch (error) {
                    console.error('[PWA] Service Worker registration failed:', error);
                }
            };

            // Register immediately
            registerSW();
        } else {
            console.log('[PWA] Service Worker not supported in this browser');
        }
    }, []);

    // Render hidden div to prevent Next.js optimization stripping
    return <div data-pwa-register="true" style={{ display: 'none' }} />;
}
