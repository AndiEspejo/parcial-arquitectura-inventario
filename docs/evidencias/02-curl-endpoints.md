# Evidencia 02 — Smoke Tests curl

**Fecha:** 2026-06-09  
**API base URL:** http://localhost:3001  
**Todos los endpoints respondieron con el código HTTP esperado.**

---

### GET /health — 200 OK

```
GET /health

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 15
ETag: W/"f-VaSQ4oDUiZblZNAEkkN+sX+q3Sg"
Date: Tue, 09 Jun 2026 21:44:24 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"status":"ok"}
```

---

### GET inventario warehouseId=1 — 200 OK con _links

```
GET /api/inventory?warehouseId=1
Header: X-API-Version: 1

HTTP/1.1 200 OK
X-Powered-By: Express
X-API-Version: 1
Content-Type: application/json; charset=utf-8
Content-Length: 1696
ETag: W/"6a0-vLViNdgmvuYOKqLop2CI8swxRbk"
Date: Tue, 09 Jun 2026 21:44:25 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":{"warehouse":{"id":1,"name":"Central Distribution Center","city":"Buenos Aires","address":"Av. San Martín 1450, CABA","created_at":"2026-06-09T21:43:17.197Z","_links":{"self":{"href":"http://localhost:3001/api/warehouses/1","method":"GET"},"inventory":{"href":"http://localhost:3001/api/inventory?warehouseId=1","method":"GET"}}},"products":[{"id":1,"name":"Laptop ProBook 450","sku":"SKU-LP-001","description":"Business laptop 15.6\", Intel i7, 16 GB RAM, 512 GB SSD","price":"1299.99","quantity":45,"created_at":"2026-06-09T21:43:17.199Z","_links":{"self":{"href":"http://localhost:3001/api/products/1","method":"GET"},"warehouse":{"href":"http://localhost:3001/api/warehouses/1","method":"GET"}}},{"id":2,"name":"Wireless Keyboard K380","sku":"SKU-KB-001","description":"Compact Bluetooth keyboard, multi-device, 2 years battery","price":"49.99","quantity":120,"created_at":"2026-06-09T21:43:17.199Z","_links":{"self":{"href":"http://localhost:3001/api/products/2","method":"GET"},"warehouse":{"href":"http://localhost:3001/api/warehouses/1","method":"GET"}}},{"id":3,"name":"USB-C Hub 7-in-1","sku":"SKU-HB-001","description":"USB-C hub with HDMI 4K, 3×USB-A, SD card reader, PD 100W","price":"39.99","quantity":200,"created_at":"2026-06-09T21:43:17.199Z","_links":{"self":{"href":"http://localhost:3001/api/products/3","method":"GET"},"warehouse":{"href":"http://localhost:3001/api/warehouses/1","method":"GET"}}}],"totalProducts":3},"_links":{"self":{"href":"http://localhost:3001/api/inventory?warehouseId=1","method":"GET"},"warehouse":{"href":"http://localhost:3001/api/warehouses/1","method":"GET"},"warehouses":{"href":"http://localhost:3001/api/warehouses","method":"GET"}}}
```

---

### GET inventario sin header X-API-Version — 400 Bad Request

```
GET /api/inventory?warehouseId=1
(sin header X-API-Version)

HTTP/1.1 400 Bad Request
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 160
ETag: W/"a0-Uo90UYZ6JJJa+5VUt+yx3Kw1ZQI"
Date: Tue, 09 Jun 2026 21:44:26 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Missing Required Header","message":"X-API-Version header is required for all /api routes.","requiredHeader":"X-API-Version","supportedVersions":["1"]}
```

---

### GET inventario sin warehouseId — 400 Bad Request

```
GET /api/inventory
Header: X-API-Version: 1

HTTP/1.1 400 Bad Request
X-Powered-By: Express
X-API-Version: 1
Content-Type: application/json; charset=utf-8
Content-Length: 117
ETag: W/"75-yGP6lys5ApNZfLSsu37n0mTTywc"
Date: Tue, 09 Jun 2026 21:44:29 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Bad Request","message":"warehouseId query parameter is required.","example":"/api/inventory?warehouseId=1"}
```

---

### GET inventario warehouseId inexistente — 404 Not Found

```
GET /api/inventory?warehouseId=999
Header: X-API-Version: 1

HTTP/1.1 404 Not Found
X-Powered-By: Express
X-API-Version: 1
Content-Type: application/json; charset=utf-8
Content-Length: 71
ETag: W/"47-UKc/R+Q4qaQY6yy4g1I/Uf13+Dg"
Date: Tue, 09 Jun 2026 21:44:30 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Not Found","message":"Warehouse with id 999 does not exist."}
```

---

### GET inventario versión no soportada — 406 Not Acceptable

```
GET /api/inventory?warehouseId=1
Header: X-API-Version: 99

HTTP/1.1 406 Not Acceptable
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 154
ETag: W/"9a-OOH6Z4KMKBTrKEyDlDqsyOSZNUg"
Date: Tue, 09 Jun 2026 21:44:31 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"API Version Not Acceptable","message":"Version \"99\" is not supported. Supported versions: 1","receivedVersion":"99","supportedVersions":["1"]}
```

---

### POST producto válido en warehouse existente — 201 Created + Location

```
POST /api/products
Header: X-API-Version: 1
Header: Content-Type: application/json
Body: {"name":"Evidence Widget 001","sku":"SKU-EVID-001","description":"Producto de evidencia para prueba","price":29.99,"quantity":5,"warehouseId":1}

HTTP/1.1 201 Created
X-Powered-By: Express
X-API-Version: 1
Location: http://localhost:3001/api/products/12
Content-Type: application/json; charset=utf-8
Content-Length: 451
ETag: W/"1c3-G5wa3bOYFtnMdHa+roH1sowrnrs"
Date: Tue, 09 Jun 2026 21:44:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":{"id":12,"warehouse_id":1,"name":"Evidence Widget 001","sku":"SKU-EVID-001","description":"Producto de evidencia para prueba","price":"29.99","quantity":5,"created_at":"2026-06-09T21:44:34.726Z","_links":{"self":{"href":"http://localhost:3001/api/products/12","method":"GET"},"warehouse":{"href":"http://localhost:3001/api/warehouses/1","method":"GET"},"inventory":{"href":"http://localhost:3001/api/inventory?warehouseId=1","method":"GET"}}}}
```

---

### POST producto SKU repetido — 409 Conflict

```
POST /api/products
Header: X-API-Version: 1
Header: Content-Type: application/json
Body: {"name":"Evidence Widget 001 Dup","sku":"SKU-EVID-001","price":9.99,"quantity":1,"warehouseId":1}

HTTP/1.1 409 Conflict
X-Powered-By: Express
X-API-Version: 1
Content-Type: application/json; charset=utf-8
Content-Length: 140
ETag: W/"8c-jK4pVO66RV1/4LbjyJsPNNzVhvQ"
Date: Tue, 09 Jun 2026 21:44:40 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Conflict","message":"A record with one or more unique fields already exists.","detail":"Key (sku)=(SKU-EVID-001) already exists."}
```

---

### POST producto body inválido — 400 Validation Error

```
POST /api/products
Header: X-API-Version: 1
Header: Content-Type: application/json
Body: {}

HTTP/1.1 400 Bad Request
X-Powered-By: Express
X-API-Version: 1
Content-Type: application/json; charset=utf-8
Content-Length: 256
ETag: W/"100-a5OHU1GaHWzEIwvqSAH2NSQsPMA"
Date: Tue, 09 Jun 2026 21:44:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Validation Error","message":"Request body validation failed.","errors":["name is required and must be a non-empty string.","sku is required and must be a non-empty string.","price is required.","quantity is required.","warehouseId is required."]}
```

---

### GET warehouses con header — 200 OK

```
GET /api/warehouses
Header: X-API-Version: 1

HTTP/1.1 200 OK
X-Powered-By: Express
X-API-Version: 1
Content-Type: application/json; charset=utf-8
Content-Length: 1037
ETag: W/"40d-sHQwHhervoPRoB54deV/nApdCNQ"
Date: Tue, 09 Jun 2026 21:44:35 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":[{"id":1,"name":"Central Distribution Center","city":"Buenos Aires","address":"Av. San Martín 1450, CABA","created_at":"2026-06-09T21:43:17.197Z","_links":{"self":{"href":"http://localhost:3001/api/warehouses/1","method":"GET"},"inventory":{"href":"http://localhost:3001/api/inventory?warehouseId=1","method":"GET"}}},{"id":2,"name":"North Regional Depot","city":"Córdoba","address":"Ruta Nacional 9 Km 712, Córdoba Capital","created_at":"2026-06-09T21:43:17.197Z","_links":{"self":{"href":"http://localhost:3001/api/warehouses/2","method":"GET"},"inventory":{"href":"http://localhost:3001/api/inventory?warehouseId=2","method":"GET"}}},{"id":3,"name":"South Logistics Hub","city":"Rosario","address":"Av. del Trabajo 880, Rosario","created_at":"2026-06-09T21:43:17.197Z","_links":{"self":{"href":"http://localhost:3001/api/warehouses/3","method":"GET"},"inventory":{"href":"http://localhost:3001/api/inventory?warehouseId=3","method":"GET"}}}],"_links":{"self":{"href":"http://localhost:3001/api/warehouses","method":"GET"}}}
```

---

### GET /api-docs — 200 OK (Swagger UI HTML)

```
GET /api-docs/

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
```

Nota: GET /api-docs (sin trailing slash) responde 301 → redirige a /api-docs/ → 200 OK.

---

**Resumen de resultados:**

| Endpoint | Esperado | Obtenido | OK |
|---|---|---|---|
| GET /health | 200 | 200 | ✓ |
| GET /api/inventory?warehouseId=1 (con header v1) | 200 + _links | 200 + _links | ✓ |
| GET /api/inventory?warehouseId=1 (sin header) | 400 | 400 | ✓ |
| GET /api/inventory (sin warehouseId, con header) | 400 | 400 | ✓ |
| GET /api/inventory?warehouseId=999 (con header) | 404 | 404 | ✓ |
| GET /api/inventory (X-API-Version: 99) | 406 | 406 | ✓ |
| POST /api/products (body válido) | 201 + Location | 201 + Location | ✓ |
| POST /api/products (SKU duplicado) | 409 | 409 | ✓ |
| POST /api/products (body inválido) | 400 | 400 | ✓ |
| GET /api/warehouses (con header) | 200 | 200 | ✓ |
| GET /api-docs/ | 200 HTML | 200 HTML | ✓ |
