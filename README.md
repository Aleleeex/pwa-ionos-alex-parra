# Progressive Web App (PWA) — Documentación Técnica

## Índice

1. [Web App Manifest (`manifest.json`)](#1-web-app-manifest-manifestjson)
2. [Service Workers](#2-service-workers)
3. [Estrategias de Almacenamiento (Caching)](#3-estrategias-de-almacenamiento-caching)
4. [Seguridad y TLS](#4-seguridad-y-tls)

---

## 1. Web App Manifest (`manifest.json`)

El Web App Manifest es un archivo JSON que proporciona al navegador la información necesaria para instalar y presentar la aplicación web de forma nativa en el dispositivo del usuario. Sin este archivo, el navegador no puede ofrecer la experiencia de instalación característica de una PWA.

### Propiedades clave

#### `theme_color`

Define el color que el sistema operativo y el navegador utilizan para colorear elementos de la interfaz del sistema, como la barra de estado en Android o la barra de título en escritorio. No afecta al contenido de la aplicación en sí, sino a la cromo del sistema que la rodea.

```json
"theme_color": "#1a73e8"
```

Cuando el usuario tiene la PWA instalada, este color aparece en el task switcher del sistema operativo, reforzando la identidad visual de la aplicación fuera del navegador.

#### `background_color`

Especifica el color de fondo que se muestra en la pantalla de inicio (splash screen) mientras la aplicación carga por primera vez tras ser lanzada desde el ícono de inicio. Actúa como un marcador de posición visual antes de que el CSS de la aplicación se aplique, evitando un parpadeo de pantalla en blanco.

```json
"background_color": "#ffffff"
```

Es recomendable que coincida con el color de fondo del `body` de la aplicación para lograr una transición imperceptible.

#### `display`

Controla el modo de visualización de la aplicación una vez instalada. Los dos valores más relevantes son:

| Valor        | Comportamiento                                                                                                                                                    |
|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `standalone` | La aplicación se abre en su propia ventana, sin la barra de direcciones ni los controles del navegador. Ofrece la experiencia más cercana a una aplicación nativa. |
| `browser`    | La aplicación se abre en una pestaña normal del navegador, con todos sus controles visibles. Esencialmente no cambia el comportamiento de una web convencional.    |

```json
"display": "standalone"
```

Otros valores intermedios son `fullscreen` (oculta incluso la barra de estado del sistema) y `minimal-ui` (muestra un conjunto mínimo de controles del navegador).

#### Array `icons`

El array `icons` define el conjunto de imágenes que el sistema operativo utilizará para representar la aplicación en distintos contextos: pantalla de inicio, launcher, pantalla de carga, configuración del sistema, etc.

```json
"icons": [
  {
    "src": "/icons/icon-192x192.png",
    "sizes": "192x192",
    "type": "image/png"
  },
  {
    "src": "/icons/icon-512x512.png",
    "sizes": "512x512",
    "type": "image/png"
  },
  {
    "src": "/icons/icon-512x512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "maskable"
  }
]
```

La importancia de proveer múltiples tamaños radica en que distintos dispositivos y densidades de pantalla requieren resoluciones diferentes. Si no se provee el tamaño adecuado, el sistema operativo escala la imagen disponible, lo que puede resultar en íconos borrosos o pixelados. El atributo `purpose: "maskable"` indica que el ícono está diseñado para ser recortado en formas adaptativas (círculos, cuadrados redondeados) según las convenciones de cada plataforma.

---

## 2. Service Workers

Un Service Worker es un script JavaScript que el navegador ejecuta en un hilo separado del hilo principal de la página (un Web Worker dedicado). Esto significa que no tiene acceso al DOM y no bloquea la interfaz de usuario. Su función principal es actuar como un intermediario programable entre la aplicación web y la red.

### Proceso de registro

El registro se realiza desde el JavaScript principal de la aplicación, verificando primero que el navegador soporte la API:

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado con scope:', registration.scope);
      })
      .catch(error => {
        console.error('Error al registrar el Service Worker:', error);
      });
  });
}
```

El `scope` define el conjunto de URLs que el Service Worker puede controlar. Por defecto, es el directorio donde reside el archivo del Service Worker. Un Service Worker en `/sw.js` controla toda la aplicación; uno en `/admin/sw.js` solo controla las rutas bajo `/admin/`.

### Ciclo de vida

El ciclo de vida de un Service Worker tiene tres fases principales:

#### Installation (Instalación)

Se dispara cuando el navegador detecta un Service Worker nuevo o modificado. Es el momento ideal para pre-cachear los recursos estáticos esenciales de la aplicación (el "app shell").

```javascript
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('app-shell-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/app.js'
      ]);
    })
  );
});
```

`event.waitUntil()` extiende la fase de instalación hasta que la promesa se resuelva, garantizando que el cacheo se complete antes de continuar.

#### Activation (Activación)

Un Service Worker recién instalado no toma el control inmediatamente si ya existe una versión anterior activa controlando clientes abiertos. Solo se activa cuando todas las pestañas que usan la versión anterior se cierran. La fase de activación es el momento adecuado para limpiar cachés de versiones anteriores.

```javascript
self.addEventListener('activate', event => {
  const cacheWhitelist = ['app-shell-v2'];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

#### Fetching (Intercepción de peticiones)

Una vez activo, el Service Worker intercepta todas las peticiones de red que realizan las páginas bajo su scope mediante el evento `fetch`. Aquí reside su poder como proxy de red.

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
```

### Service Worker como proxy de red

El Service Worker se posiciona entre la aplicación y la red, interceptando cada petición HTTP saliente. Esto le otorga control total sobre cómo se responde a cada petición:

- Puede responder directamente desde la cache sin tocar la red (modo offline).
- Puede realizar la petición a la red y almacenar la respuesta en cache para uso futuro.
- Puede modificar la petición antes de enviarla (cambiar headers, URL, etc.).
- Puede combinar respuestas de múltiples fuentes.

Esta arquitectura de proxy es lo que hace posible el funcionamiento offline, la carga instantánea y la sincronización en segundo plano de las PWA.

---

## 3. Estrategias de Almacenamiento (Caching)

La elección de la estrategia de cache determina el equilibrio entre velocidad de respuesta, frescura de los datos y disponibilidad offline. No existe una estrategia universalmente óptima; la decisión depende del tipo de recurso.

### Comparativa técnica

| Estrategia              | Velocidad de respuesta | Frescura de datos | Disponibilidad offline | Caso de uso ideal                                |
|-------------------------|------------------------|-------------------|------------------------|--------------------------------------------------|
| Cache First             | Muy alta               | Baja              | Total                  | Assets estáticos versionados (JS, CSS, fuentes)  |
| Network First           | Baja (depende de red)  | Alta              | Parcial (fallback)     | Datos de API que deben estar actualizados         |
| Stale-While-Revalidate  | Alta                   | Media             | Total                  | Contenido que tolera cierta desactualización      |

### Cache First

La aplicación busca el recurso en la cache primero. Si existe, lo devuelve inmediatamente sin contactar la red. Solo si no está en cache realiza una petición de red y almacena el resultado.

```
Petición -> Cache -> [HIT] Respuesta inmediata
                  -> [MISS] Red -> Cache -> Respuesta
```

**Ventaja:** Tiempo de respuesta mínimo, funciona completamente offline.  
**Desventaja:** El usuario puede recibir contenido desactualizado si el recurso en cache no ha expirado o no ha sido invalidado manualmente.

**Adecuado para:** Archivos con hash en el nombre (`main.a3f2c1.js`), fuentes web, imágenes que no cambian.

### Network First

La aplicación intenta obtener el recurso de la red primero. Si la red responde exitosamente, almacena la respuesta en cache y la devuelve. Si la red falla (timeout, sin conexión), recurre a la versión en cache como fallback.

```
Petición -> Red -> [OK] Cache -> Respuesta actualizada
                -> [FAIL] Cache -> Respuesta de fallback
```

**Ventaja:** El usuario siempre recibe los datos más recientes cuando hay conexión.  
**Desventaja:** La velocidad de respuesta depende completamente de la latencia de la red. Si la red es lenta, la experiencia es lenta.

**Adecuado para:** Endpoints de API con datos dinámicos, feeds de noticias, información de perfil de usuario.

### Stale-While-Revalidate

La aplicación responde inmediatamente con la versión en cache (stale = obsoleta) mientras, en segundo plano, realiza una petición a la red para actualizar la cache. La próxima vez que se solicite el recurso, ya estará actualizado.

```
Petición -> Cache -> Respuesta inmediata (posiblemente desactualizada)
         -> Red (en paralelo) -> Actualiza cache para la próxima petición
```

**Ventaja:** Combina velocidad de respuesta inmediata con actualización eventual de los datos. El usuario nunca espera.  
**Desventaja:** El usuario puede ver datos desactualizados en la petición actual (se verán actualizados en la siguiente carga).

**Adecuado para:** Avatares de usuario, configuraciones de la aplicación, contenido que cambia con frecuencia moderada pero donde un ligero retraso en la actualización es aceptable.

---

## 4. Seguridad y TLS

### Por qué HTTPS es un requisito habilitador para los Service Workers

Los Service Workers son, por diseño, una tecnología de intercepción de red. Un Service Worker malicioso o comprometido podría interceptar todas las peticiones de un usuario, modificar respuestas, inyectar contenido arbitrario o robar credenciales. Esta capacidad de man-in-the-middle es extremadamente poderosa y, por tanto, extremadamente peligrosa si se expone sin protección.

Por esta razón, el estándar W3C establece que los Service Workers **solo pueden registrarse y operar bajo conexiones HTTPS**. TLS (Transport Layer Security) garantiza dos propiedades fundamentales:

1. **Autenticidad:** El certificado TLS verifica criptográficamente que el servidor es quien dice ser. El usuario puede confiar en que el Service Worker que descarga proviene del dominio legítimo y no de un atacante que interceptó la conexión.

2. **Integridad:** La conexión cifrada garantiza que el script del Service Worker no ha sido modificado en tránsito. Sin TLS, un atacante en la misma red (por ejemplo, en una red Wi-Fi pública) podría alterar el archivo `service-worker.js` antes de que llegue al navegador, inyectando código malicioso.

La única excepción permitida por los navegadores es `localhost`, que se trata como un origen seguro para facilitar el desarrollo local sin necesidad de configurar certificados.

### Impacto de los certificados TLS en el "Install Prompt" del navegador

El "Install Prompt" (o `beforeinstallprompt` event) es el mecanismo mediante el cual el navegador ofrece al usuario la posibilidad de instalar la PWA en su dispositivo. Para que este prompt se active, el navegador verifica una serie de criterios conocidos como "installability criteria". HTTPS es uno de los criterios fundamentales e innegociables.

Los criterios completos incluyen:

- La aplicación se sirve sobre HTTPS (o `localhost`).
- La aplicación tiene un `manifest.json` válido con los campos requeridos (`name` o `short_name`, `icons` con al menos un ícono de 192x192, `start_url`, `display` con valor `standalone`, `fullscreen` o `minimal-ui`).
- La aplicación tiene un Service Worker registrado con un manejador del evento `fetch`.

Si el certificado TLS es inválido (autofirmado sin ser de confianza, expirado, o el dominio no coincide), el navegador:

1. Muestra una advertencia de seguridad al usuario antes de cargar la página.
2. No considera el origen como seguro.
3. Bloquea el registro del Service Worker.
4. No dispara el evento `beforeinstallprompt`, impidiendo completamente la instalación de la PWA.

En consecuencia, un certificado TLS válido emitido por una Autoridad Certificadora (CA) de confianza no es una mejora opcional de seguridad para una PWA: es un prerrequisito técnico sin el cual las características definitorias de la tecnología (funcionamiento offline, instalabilidad) son inaccesibles.

---

## Referencias

- [W3C Web App Manifest Specification](https://www.w3.org/TR/appmanifest/)
- [Service Workers W3C Specification](https://www.w3.org/TR/service-workers/)
- [MDN Web Docs — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN Web Docs — Web App Manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Google Developers — PWA Installability Criteria](https://web.dev/articles/install-criteria)
- [Workbox Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview/)
