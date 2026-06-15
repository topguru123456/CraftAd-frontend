/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', md: '2rem', lg: '3rem' } },
    extend: {
      colors: {
        brand: { 50:'#FFF1F6',100:'#FFE1EC',200:'#FFC3D8',300:'#FF9DBE',400:'#FF7AA6',500:'#ED5699',600:'#D63F84',700:'#B32E6C',800:'#8C2354',900:'#621A3C' },
        coral: { 400:'#FFA8A8', 500:'#FF8586', 600:'#F26B6C' },
        ink: { DEFAULT:'#0A1F30', muted:'#5A6B7A', soft:'#8A98A6' },
        surface: { DEFAULT:'#FFFFFF', subtle:'#FAFBFC', muted:'#F2F4F7' },
        line: '#E5E9EE',
        success:'#16A34A', warning:'#F59E0B', danger:'#DC2626',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to left, #ED5699 0%, #FF8586 100%)',
        'brand-gradient-soft': 'linear-gradient(to left, rgba(237,86,153,0.12), rgba(255,133,134,0.12))',
      },
      fontFamily: {
        sans: ['"Discovery Fs"','Heebo','Rubik','system-ui','-apple-system','Segoe UI','Helvetica','Arial','sans-serif'],
      },
      fontSize: {
        base: ['1rem',     { lineHeight: '1.6' }],
        md:   ['1.125rem', { lineHeight: '1.6' }],
        lg:   ['1.25rem',  { lineHeight: '1.5' }],
        xl:   ['1.5rem',   { lineHeight: '1.4' }],
        '2xl':['2rem',     { lineHeight: '1.25' }],
        '3xl':['2.5rem',   { lineHeight: '1.2' }],
      },
      /* `3xl` kicks in on monitors wider than ~1920px (full-window 1080p
       * maximized, plus 1440p and 4K). Used by surfaces that want to
       * fan out to a 4-up grid on wide displays without disturbing the
       * default 3-up at 2xl (1536px). */
      screens: { '3xl': '1920px' },
      borderRadius: { input:'10px', button:'12px', card:'16px', pill:'9999px' },
      boxShadow: {
        soft:'0 2px 8px rgba(10,31,48,0.06)',
        card:'0 8px 24px rgba(10,31,48,0.08)',
        focus:'0 0 0 3px rgba(237,86,153,0.25)',
        brand:'0 8px 20px rgba(237,86,153,0.35)',
      },
      keyframes: {
        'fade-in':  { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'modal-in': { from: { opacity: 0, transform: 'scale(0.96) translateY(8px)' }, to: { opacity: 1, transform: 'scale(1) translateY(0)' } },
        'slide-in-right': { from: { opacity: 0, transform: 'translateX(40px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        'slide-out-right': { from: { opacity: 1, transform: 'translateX(0)' }, to: { opacity: 0, transform: 'translateX(40px)' } },
        /* Side drawer: slides in from off-screen end (visual left in RTL).
         * App is RTL-only today; if/when LTR support lands, dir-aware
         * variants belong here. */
        'drawer-in-end': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in':'fade-in 250ms ease-out',
        'slide-up':'slide-up 250ms ease-out',
        'modal-in':'modal-in 220ms cubic-bezier(0.16,1,0.3,1)',
        'slide-in-right':'slide-in-right 220ms cubic-bezier(0.16,1,0.3,1)',
        'slide-out-right':'slide-out-right 180ms ease-in forwards',
        'drawer-in-end':'drawer-in-end 240ms cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
};
