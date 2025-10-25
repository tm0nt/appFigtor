// Service Worker simples - apenas para permitir instalação
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado')
  event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Deixa o navegador fazer o fetch normalmente
  event.respondWith(fetch(event.request))
})
