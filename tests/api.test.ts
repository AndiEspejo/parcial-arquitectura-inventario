/**
 * Integration tests — Warehouse Inventory API
 *
 * Requirements:
 *   - Docker Compose DB must be running: `docker compose up -d db`
 *   - Environment variables must be set (or use defaults via .env):
 *     DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 *
 * Run: npm test
 */

import request from 'supertest';
import app from '../src/app';
import pool from '../src/db';

// Shared header required by all /api routes
const V1 = { 'X-API-Version': '1' };

afterAll(async () => {
  // Remove rows created by the test suite so the DB keeps only seed data
  await pool.query("DELETE FROM products WHERE sku LIKE 'TEST-SKU-%'");
  // Close pg pool to allow Jest to exit cleanly
  await pool.end();
});

// ---------------------------------------------------------------------------
// API Version middleware
// ---------------------------------------------------------------------------
describe('API Version middleware', () => {
  it('returns 400 when X-API-Version header is missing', async () => {
    const res = await request(app).get('/api/warehouses');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.requiredHeader).toBe('X-API-Version');
  });

  it('returns 406 when X-API-Version header has unsupported value', async () => {
    const res = await request(app)
      .get('/api/warehouses')
      .set('X-API-Version', '99');
    expect(res.status).toBe(406);
    expect(res.body).toHaveProperty('receivedVersion', '99');
  });

  it('echoes X-API-Version in response header on valid request', async () => {
    const res = await request(app)
      .get('/api/warehouses')
      .set(V1);
    expect(res.status).toBe(200);
    expect(res.headers['x-api-version']).toBe('1');
  });
});

// ---------------------------------------------------------------------------
// GET /api/inventory
// ---------------------------------------------------------------------------
describe('GET /api/inventory', () => {
  it('returns 400 when warehouseId param is missing', async () => {
    const res = await request(app).get('/api/inventory').set(V1);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/warehouseId/i);
  });

  it('returns 400 when warehouseId is not a positive integer', async () => {
    const res = await request(app).get('/api/inventory?warehouseId=abc').set(V1);
    expect(res.status).toBe(400);
  });

  it('returns 404 when warehouse does not exist', async () => {
    const res = await request(app).get('/api/inventory?warehouseId=99999').set(V1);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  it('returns 200 with inventory data and _links for a valid warehouse', async () => {
    const res = await request(app).get('/api/inventory?warehouseId=1').set(V1);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('warehouse');
    expect(res.body.data).toHaveProperty('products');
    expect(Array.isArray(res.body.data.products)).toBe(true);
    expect(res.body).toHaveProperty('_links');
    expect(res.body._links).toHaveProperty('self');
    expect(res.body._links).toHaveProperty('warehouse');
  });

  it('each product in inventory response has _links.self and _links.warehouse', async () => {
    const res = await request(app).get('/api/inventory?warehouseId=1').set(V1);
    expect(res.status).toBe(200);
    const products: Array<{ _links: Record<string, unknown> }> = res.body.data.products;
    if (products.length > 0) {
      expect(products[0]._links).toHaveProperty('self');
      expect(products[0]._links).toHaveProperty('warehouse');
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/warehouses & GET /api/warehouses/:id
// ---------------------------------------------------------------------------
describe('GET /api/warehouses', () => {
  it('returns 200 with a list of warehouses', async () => {
    const res = await request(app).get('/api/warehouses').set(V1);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('returns 200 for an existing warehouse id', async () => {
    const res = await request(app).get('/api/warehouses/1').set(V1);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', 1);
    expect(res.body.data).toHaveProperty('_links');
  });

  it('returns 404 for a non-existent warehouse id', async () => {
    const res = await request(app).get('/api/warehouses/99999').set(V1);
    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-integer warehouse id', async () => {
    const res = await request(app).get('/api/warehouses/abc').set(V1);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/products
// ---------------------------------------------------------------------------
describe('POST /api/products', () => {
  const uniqueSku = (): string => `TEST-SKU-${Date.now()}`;

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/products')
      .set(V1)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('returns 400 when price is negative', async () => {
    const res = await request(app)
      .post('/api/products')
      .set(V1)
      .send({ name: 'Test', sku: uniqueSku(), price: -5, quantity: 10, warehouseId: 1 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when quantity is negative', async () => {
    const res = await request(app)
      .post('/api/products')
      .set(V1)
      .send({ name: 'Test', sku: uniqueSku(), price: 10, quantity: -1, warehouseId: 1 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when the warehouse does not exist', async () => {
    const res = await request(app)
      .post('/api/products')
      .set(V1)
      .send({ name: 'Test Product', sku: uniqueSku(), price: 10.99, quantity: 5, warehouseId: 99999 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  it('returns 201 with Location header when product is created', async () => {
    const sku = uniqueSku();
    const res = await request(app)
      .post('/api/products')
      .set(V1)
      .send({ name: 'Integration Test Product', sku, price: 19.99, quantity: 10, warehouseId: 1 });
    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty('location');
    expect(res.body.data).toHaveProperty('sku', sku);
    expect(res.body.data).toHaveProperty('_links');
    expect(res.body.data._links).toHaveProperty('self');
    expect(res.body.data._links).toHaveProperty('warehouse');
  });

  it('returns 409 on duplicate SKU', async () => {
    const sku = uniqueSku();
    // First insert — must succeed
    await request(app)
      .post('/api/products')
      .set(V1)
      .send({ name: 'Dup Test', sku, price: 9.99, quantity: 1, warehouseId: 1 });

    // Second insert — must conflict
    const res = await request(app)
      .post('/api/products')
      .set(V1)
      .send({ name: 'Dup Test 2', sku, price: 9.99, quantity: 1, warehouseId: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
  });
});

// ---------------------------------------------------------------------------
// GET /api/products/:id
// ---------------------------------------------------------------------------
describe('GET /api/products/:id', () => {
  it('returns 200 for an existing product', async () => {
    const res = await request(app).get('/api/products/1').set(V1);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', 1);
    expect(res.body.data).toHaveProperty('_links');
  });

  it('returns 404 for a non-existent product', async () => {
    const res = await request(app).get('/api/products/99999').set(V1);
    expect(res.status).toBe(404);
  });
});
