/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/app/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '0.75em'
      },
      screens: {
        xl: '1440px',
        '2xl': '1600px'
      }
    },
    extend: {
      colors: {
        foreground: 'hsl(var(--foreground))',
        background: 'hsl(var(--background))',
        gray: {
          100: 'hsl(var(--gray-100))',
          200: 'hsl(var(--gray-200))',
          300: 'hsl(var(--gray-300))',
          400: 'hsl(var(--gray-400))',
          500: 'hsl(var(--gray-500))',
          600: 'hsl(var(--gray-600))'
        },
        error: 'hsl(var(--error))'
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5', letterSpacing: '-0.12px' }],
        sm: ['14px', { lineHeight: '1.5', letterSpacing: '-0.14px' }],
        base: ['15px', { lineHeight: '1.5', letterSpacing: '-0.15px' }],
        lg: ['18px', { lineHeight: '1.5', letterSpacing: '-0.18px' }],
        xl: ['20px', { lineHeight: '1.2', letterSpacing: '-0.2px', fontWeight: '500' }],
        '2xl': ['24px', { lineHeight: '1.2', letterSpacing: '-0.48px', fontWeight: '500' }],
        '3xl': ['32px', { lineHeight: '1.2', letterSpacing: '-0.32px', fontWeight: '500' }],
        '4xl': ['40px', { lineHeight: '1', letterSpacing: '-0.4px', fontWeight: '500' }],
        '5xl': ['70px', { lineHeight: '0.9', letterSpacing: '-0.7px', fontWeight: '500' }],
        '6xl': ['80px', { lineHeight: '0.9', letterSpacing: '-1.6px', fontWeight: '500' }],
        '7xl': ['90px', { lineHeight: '0.9', letterSpacing: '-3.6px', fontWeight: '500' }],
        '8xl': ['110px', { lineHeight: '0.9', letterSpacing: '-2.2px', fontWeight: '500' }],
        '9xl': ['150px', { lineHeight: '0.9', letterSpacing: '-3.6px', fontWeight: '500' }]
      },
      transitionTimingFunction: {
        'm-ease': 'var(--m-ease)'
      },
      borderRadius: {
        '4xl': '32px'
      }
    }
  }
}
