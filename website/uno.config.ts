import {
  defineConfig,
  presetIcons,
  presetUno,
  presetWebFonts,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetWebFonts({
      provider: 'bunny',
      fonts: {
        sans: 'Inter:400,500,600,700',
        mono: 'JetBrains Mono:400,500',
      },
    }),
  ],
  transformers: [transformerDirectives()],
  shortcuts: {
    'text-gradient':
      'bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent',
  },
  theme: {
    colors: {
      surface: {
        DEFAULT: '#0a0a0a',
        1: '#111111',
        2: '#1a1a1a',
        3: '#222222',
      },
      border: {
        DEFAULT: '#2a2a2a',
        hover: '#3a3a3a',
      },
    },
  },
})
