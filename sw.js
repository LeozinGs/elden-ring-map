const CACHE_NAME = 'elden-ring-map-v1';

// Recursos externos que vamos tentar cachear
const EXTERNAL_CACHE = [
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/4.6.2/css/bootstrap.min.css',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(EXTERNAL_CACHE).catch(() => {
        // Ignora erros de cache em recursos externos
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado!');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Estratégia: tenta rede primeiro, cai no cache se offline
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cacheia recursos estáticos externos (css, fontes, imagens)
        if (
          response.ok &&
          (url.includes('cdnjs.cloudflare.com') ||
           url.includes('cdn.mapgenie.io'))
        ) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return response;
      })
      .catch(() => {
        // Se offline, busca no cache
        return caches.match(event.request);
      })
  );
});
