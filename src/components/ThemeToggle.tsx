'use client';

import { useState, useEffect } from 'react';

export function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load from localStorage or detect system preference
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

        let initialTheme: 'light' | 'dark';
        if (savedTheme) {
            initialTheme = savedTheme;
        } else {
            // Detect system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            initialTheme = prefersDark ? 'dark' : 'light';
        }

        setTheme(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);

        // Add/remove dark class for Tailwind v4
        if (initialTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        // Set both data-theme attribute AND dark class for Tailwind v4
        document.documentElement.setAttribute('data-theme', newTheme);

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Avoid hydration mismatch
    if (!mounted) {
        return (
            <button
                className="p-2.5 rounded-lg bg-white border border-slate-200 w-10 h-10"
                aria-label="Toggle theme"
                disabled
            >
                <span className="opacity-0">🌙</span>
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <span className="text-xl">
                {theme === 'light' ? '🌙' : '☀️'}
            </span>
        </button>
    );
}
