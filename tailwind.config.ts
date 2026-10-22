import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        charcoal: '#1A1A1A',
        deepBlack: '#111111',
        sandGold: '#C2A77A',
        sandGoldHover: '#B39665',
        mutedGrey: '#666666',
        softGrey: '#E5E5E5',
        surfaceGrey: '#F8F8F8',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      letterSpacing: {
        'tightest': '-0.02em',
        'subtle': '0.02em',
        'wide-nav': '0.1em',
        'wide-btn': '0.05em',
      },
      boxShadow: {
        'soft-lift': '0 4px 20px -2px rgba(229, 229, 229, 0.8)',
      },
    },
  },
  plugins: [],
};

export default config;
