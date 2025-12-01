/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Nord Color Palette
        // Polar Night (dark backgrounds)
        'nord-deep': '#1a1d23', // Deeper than nord0 for better contrast
        nord0: '#2e3440',
        nord1: '#3b4252',
        nord2: '#434c5e',
        nord3: '#4c566a',
        // Snow Storm (light backgrounds)
        nord4: '#d8dee9',
        nord5: '#e5e9f0',
        nord6: '#eceff4',
        // Frost (blues - primary accent colors)
        nord7: '#8fbcbb',
        nord8: '#88c0d0',
        nord9: '#81a1c1',
        nord10: '#5e81ac',
        // Aurora (colorful accents)
        nord11: '#bf616a', // red
        nord12: '#d08770', // orange
        nord13: '#ebcb8b', // yellow
        nord14: '#a3be8c', // green
        nord15: '#b48ead', // purple
        
        // Semantic color mappings
        primary: {
          50: '#ebf1f5',
          100: '#d1e3eb',
          200: '#a3c7d7',
          300: '#88c0d0',
          400: '#81a1c1',
          500: '#5e81ac',
          600: '#4c6a95',
          700: '#3b5379',
          800: '#2e415c',
          900: '#1e2e42'
        },
        frost: {
          teal: '#8fbcbb',
          blue: '#88c0d0',
          light: '#81a1c1',
          dark: '#5e81ac'
        },
        aurora: {
          red: '#bf616a',
          orange: '#d08770',
          yellow: '#ebcb8b',
          green: '#a3be8c',
          purple: '#b48ead'
        }
      },
      backgroundImage: {
        'gradient-nord-light': 'linear-gradient(135deg, #eceff4 0%, #e5e9f0 50%, #d8dee9 100%)',
        'gradient-nord-dark': 'linear-gradient(135deg, #14161a 0%, #1a1d23 50%, #22262e 100%)',
        'gradient-frost': 'linear-gradient(135deg, #8fbcbb 0%, #88c0d0 50%, #81a1c1 100%)',
        'gradient-aurora': 'linear-gradient(135deg, #bf616a 0%, #d08770 33%, #ebcb8b 66%, #a3be8c 100%)'
      },
      boxShadow: {
        'nord': '0 4px 6px -1px rgba(46, 52, 64, 0.1), 0 2px 4px -1px rgba(46, 52, 64, 0.06)',
        'nord-lg': '0 10px 15px -3px rgba(46, 52, 64, 0.1), 0 4px 6px -2px rgba(46, 52, 64, 0.05)',
        'nord-xl': '0 20px 25px -5px rgba(46, 52, 64, 0.1), 0 10px 10px -5px rgba(46, 52, 64, 0.04)',
      }
    }
  },
  plugins: []
}


