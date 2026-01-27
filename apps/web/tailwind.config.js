/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                success: {
                    DEFAULT: '#22c55e',
                    foreground: '#ffffff',
                },
                danger: {
                    DEFAULT: '#e14125',
                    foreground: '#ffffff',
                },
                // IIC Brand Colors
                iic: {
                    blue: '#21409a',
                    red: '#e14125',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
                sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            keyframes: {
                'flash-green': {
                    '0%, 100%': { backgroundColor: 'transparent' },
                    '50%': { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
                },
                'flash-red': {
                    '0%, 100%': { backgroundColor: 'transparent' },
                    '50%': { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
                },
            },
            animation: {
                'flash-green': 'flash-green 0.5s ease-in-out',
                'flash-red': 'flash-red 0.5s ease-in-out',
            },
        },
    },
    plugins: [],
};
