# Evidencia 04 — Frontend React (Vite + nginx + Docker)

Fecha: 2026-06-09  
Entorno: WSL2, Docker Desktop  
Puerto web (host): **8081** (8080 ocupado por otro proyecto en el host; `WEB_PORT=8081 docker compose up -d web`)

---

## 1. TypeScript strict (`tsc -b`) y build de producción (`npm run build`)

```
$ cd frontend && npm install   # sin errores de instalación
$ npx tsc -b                   # sin salida = sin errores (strict mode ok)
$ npm run build

> warehouse-inventory-frontend@1.0.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
transforming...
✓ 37 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.41 kB │ gzip:  0.27 kB
dist/assets/index-CT1yAFtd.css    4.97 kB │ gzip:  1.50 kB
dist/assets/index-BRcOi4AM.js   150.58 kB │ gzip: 48.45 kB
✓ built in 484ms
```

Sin errores de TypeScript (modo strict). Build limpio.

---

## 2. `docker compose ps` — tres contenedores corriendo

```
NAME                  IMAGE                COMMAND                  SERVICE   CREATED          STATUS                    PORTS
arquisoftware-api-1   arquisoftware-api    "docker-entrypoint.s…"   api       51 seconds ago   Up 44 seconds (healthy)   0.0.0.0:3001->3000/tcp, [::]:3001->3000/tcp
arquisoftware-db-1    postgres:16-alpine   "docker-entrypoint.s…"   db        51 seconds ago   Up 50 seconds (healthy)   0.0.0.0:5433->5432/tcp, [::]:5433->5432/tcp
arquisoftware-web-1   arquisoftware-web    "/docker-entrypoint.…"   web       4 seconds ago    Up 2 seconds              0.0.0.0:8081->80/tcp, [::]:8081->80/tcp
```

Todos en estado `Up`. `db` y `api` con healthcheck `(healthy)`.

---

## 3. Verificación mediante el contenedor web (curl)

### 3.1 SPA root — `GET /` → 200 + HTML con div#root y bundle JS

```
HTTP/1.1 200 OK
Server: nginx/1.31.1
Date: Tue, 09 Jun 2026 22:08:29 GMT
Content-Type: text/html
Content-Length: 408

<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Inventario de Almacenes</title>
    <script type="module" crossorigin src="/assets/index-BRcOi4AM.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-CT1yAFtd.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

200 OK. Contiene `<div id="root">` y referencia al bundle JS.

### 3.2 `GET /health` → 200 proxiado al API

```
HTTP/1.1 200 OK
Server: nginx/1.31.1
Content-Type: application/json; charset=utf-8
Content-Length: 15
X-Powered-By: Express

{"status":"ok"}
```

200 OK. Respuesta proviene del API (header `X-Powered-By: Express`).

### 3.3 `GET /api/warehouses` con `X-API-Version: 1` → 200 JSON + `_links` (HATEOAS)

```
HTTP/1.1 200 OK
Server: nginx/1.31.1
Content-Type: application/json; charset=utf-8
Content-Length: 1002
X-Powered-By: Express
X-API-Version: 1

{"data":[{"id":1,"name":"Central Distribution Center","city":"Buenos Aires","address":"Av. San Martín 1450, CABA","created_at":"2026-06-09T21:43:17.197Z","_links":{"self":{"href":"http://localhost/api/warehouses/1","method":"GET"},"inventory":{"href":"http://localhost/api/inventory?warehouseId=1","method":"GET"}}},{"id":2,"name":"North Regional Depot","city":"Córdoba",...},{"id":3,"name":"South Logistics Hub","city":"Rosario",...}],"_links":{"self":{"href":"http://localhost/api/warehouses","method":"GET"}}}
```

200 OK. `_links` presentes en cada warehouse y en la raíz de la respuesta.

### 3.4 `GET /api/inventory?warehouseId=1` con `X-API-Version: 1` → 200

```
HTTP/1.1 200 OK
Server: nginx/1.31.1
Content-Type: application/json; charset=utf-8
Content-Length: 1641
X-Powered-By: Express
X-API-Version: 1

{"data":{"warehouse":{"id":1,"name":"Central Distribution Center",...},"products":[{"id":1,"name":"Laptop ProBook 450","sku":"SKU-LP-001","price":"1299.99","quantity":45,...},{"id":2,...},{"id":3,...}],"totalProducts":3},"_links":{...}}
```

200 OK. Inventario con 3 productos y campo `totalProducts`.

### 3.5 `GET /api/warehouses` SIN header → 400 (prueba pass-through de headers nginx)

```
HTTP/1.1 400 Bad Request
Server: nginx/1.31.1
Content-Type: application/json; charset=utf-8
Content-Length: 160
X-Powered-By: Express

{"error":"Missing Required Header","message":"X-API-Version header is required for all /api routes.","requiredHeader":"X-API-Version","supportedVersions":["1"]}
```

400 Bad Request. nginx no inyecta ni elimina headers — el middleware del API responde correctamente.

### 3.6 Bundle JS contiene `X-API-Version`

```
$ JS_FILE=/assets/index-BRcOi4AM.js
$ curl -s http://localhost:8081${JS_FILE} | grep -o "X-API-Version"
X-API-Version
```

Confirmado: el cliente inyecta el header en tiempo de ejecución.

---

## 4. Regresión backend

### 4.1 `GET http://localhost:3001/health`

```
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health
200
```

### 4.2 Suite de tests — 20/20

```
$ DB_HOST=localhost DB_PORT=5433 DB_NAME=inventory DB_USER=postgres DB_PASSWORD=postgres npm test

PASS tests/api.test.ts (8.09 s)
  API Version middleware
    ✓ returns 400 when X-API-Version header is missing (160 ms)
    ✓ returns 406 when X-API-Version header has unsupported value (7 ms)
    ✓ echoes X-API-Version in response header on valid request (56 ms)
  GET /api/inventory
    ✓ returns 400 when warehouseId param is missing (6 ms)
    ✓ returns 400 when warehouseId is not a positive integer (6 ms)
    ✓ returns 404 when warehouse does not exist (7 ms)
    ✓ returns 200 with inventory data and _links for a valid warehouse (8 ms)
    ✓ each product in inventory response has _links.self and _links.warehouse (7 ms)
  GET /api/warehouses
    ✓ returns 200 with a list of warehouses (6 ms)
    ✓ returns 200 for an existing warehouse id (6 ms)
    ✓ returns 404 for a non-existent warehouse id (4 ms)
    ✓ returns 400 for a non-integer warehouse id (9 ms)
  POST /api/products
    ✓ returns 400 on missing required fields (79 ms)
    ✓ returns 400 when price is negative (4 ms)
    ✓ returns 400 when quantity is negative (4 ms)
    ✓ returns 404 when the warehouse does not exist (5 ms)
    ✓ returns 201 with Location header when product is created (9 ms)
    ✓ returns 409 on duplicate SKU (24 ms)
  GET /api/products/:id
    ✓ returns 200 for an existing product (12 ms)
    ✓ returns 404 for a non-existent product (5 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Time:        8.935 s
```

Sin regresiones.

---

## 5. Auditoría de código (read-only)

| Ítem | Archivo | Resultado |
|------|---------|-----------|
| `X-API-Version` inyectado en cada request | `frontend/src/api/client.ts:65-67` | ✅ — header en `apiFetch()` |
| `ApiError` maneja respuestas no-JSON | `client.ts:79-85` | ⚠️ — `response.json()` se llama ANTES de verificar `ok`; si el API devuelve texto plano en error, la promesa rechaza con `SyntaxError`, no `ApiError` (ver hallazgos) |
| `AddProductForm` — array de errores 400 | `AddProductForm.tsx:119-120` | ✅ — `err.payload.errors` renderizado |
| `AddProductForm` — mensaje 409 | `AddProductForm.tsx:117-118` | ✅ — mensaje de SKU duplicado |
| `useInventory` usa `followLink` en `_links.inventory` | `useInventory.ts:32-33` | ✅ — HATEOAS correcto |
| `nginx.conf` — SPA fallback `try_files` | `frontend/nginx.conf:36` | ✅ — presente |
| Sin `http://localhost:3001` hardcodeado en `src/` | `client.ts:34` (solo comentario JSDoc) | ✅ — solo en comentario ilustrativo |

### Hallazgo: `apiFetch` llama `response.json()` incondicionalmente (client.ts:79)

```typescript
// client.ts línea 79
const json = await response.json();   // <- puede lanzar SyntaxError si body no es JSON
if (!response.ok) { throw new ApiError(status, json); }
```

Si el backend (o nginx) devuelve un error sin body JSON (p.ej. 502 Bad Gateway de nginx con HTML), la llamada rechaza con `SyntaxError` en lugar de `ApiError`. Los componentes capturan el caso genérico (`else { setError('Error de red...') }`) por lo que la UI no rompe, pero el error no se tipifica correctamente. No es un bug bloqueante para el parcial; sí es una deuda técnica menor.
