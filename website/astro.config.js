import UnoCSS from '@unocss/astro'
// @ts-check
import { defineConfig } from 'astro/config'

export default defineConfig({
  integrations: [UnoCSS({ injectReset: true })],
})
