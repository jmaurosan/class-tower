import containerQueries from '@tailwindcss/container-queries'
import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
// Espelha exatamente a configuração que antes vivia inline no index.html,
// junto do script cdn.tailwindcss.com. O CDN não deve ser usado em produção:
// ele compila as classes no navegador a cada carregamento e, por ser um
// recurso externo, deixava o PWA sem estilo algum quando offline.
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f756f',
        'background-light': '#ffffff',
        'background-dark': '#1d222a',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [forms, containerQueries],
}
