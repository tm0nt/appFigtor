import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Figtor - Converter Figma em JSON para Elementor',
    short_name: 'Figtor',
    description: 'Converta arquivos do Figma em JSON otimizado para Elementor',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#90F209',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
