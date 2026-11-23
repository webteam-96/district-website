import type { Config } from 'tailwindcss';

/* Mirrors the ASPX js/tailwind-config.js theme.extend VERBATIM so every utility
   class resolves identically to the original site. Hex values copied exactly. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#16429B',
          bluehover: '#1d4fb0',
          bluedark: '#0B2B6B',
          bluedarker: '#0A1F4D',
          gold: '#F5A623',
          goldhover: '#e69612',
        },
        bday: '#2E9E5B',
        bdaysoft: '#E6F5EC',
        anniv: '#F08020',
        annivsoft: '#FCEBDD',
        annivdot: '#E5483A',
        evt: '#16429B',
        evtsoft: '#E7EDFA',
        ink: '#1A2B4A',
        muted: '#7A869A',
        divider: '#E8EDF5',
        pagebg: '#EEF3FB',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        script: ['Caveat', 'cursive'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(13, 38, 92, 0.06)',
        soft: '0 6px 18px rgba(13, 38, 92, 0.05)',
        pill: '0 4px 14px rgba(13, 38, 92, 0.08)',
      },
    },
  },
  // The District Snapshot tiles + calendar build some colour classes as string
  // literals in data maps; safelist the categorical stat hues so the compiled
  // build never purges them (the ASPX used the Tailwind Play CDN = no purge).
  safelist: [
    {
      pattern:
        /(bg|text|ring|from|to|border)-(blue|amber|emerald|rose|violet|cyan)-(500|600)/,
      variants: ['hover'],
    },
    { pattern: /(bg|text|ring|border)-(blue|amber|emerald|rose|violet|cyan)-600\/(10|15|20)/ },
  ],
} satisfies Config;
