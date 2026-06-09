import express from 'express';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

import { apiVersion } from './middleware/apiVersion';
import { errorHandler } from './middleware/errorHandler';
import warehousesRouter from './routes/warehouses';
import productsRouter  from './routes/products';
import inventoryRouter from './routes/inventory';

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(express.json());

// ---------------------------------------------------------------------------
// Swagger / OpenAPI docs (no version header required — developer tooling)
// ---------------------------------------------------------------------------
const openapiPath = path.resolve(__dirname, '../docs/openapi.yaml');
if (fs.existsSync(openapiPath)) {
  const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, 'utf-8')) as Record<string, unknown>;
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
}

// ---------------------------------------------------------------------------
// API routes — all require X-API-Version header
// ---------------------------------------------------------------------------
app.use('/api', apiVersion);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/products',   productsRouter);
app.use('/api/inventory',  inventoryRouter);

// ---------------------------------------------------------------------------
// Health check (no versioning required)
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Centralized error handler (must be last)
// ---------------------------------------------------------------------------
app.use(errorHandler);

export default app;
