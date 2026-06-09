import type { Request, Response, NextFunction } from 'express';
import pool from '../db';
import { link, buildLinks } from '../hateoas';
import type { Product, CreateProductDto, Warehouse } from '../types';

/**
 * GET /api/products/:id
 * Returns a single product by primary key. 404 if not found.
 */
export async function getProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Product id must be a positive integer.',
    });
    return;
  }

  try {
    const result = await pool.query<Product>(
      `SELECT id, warehouse_id, name, sku, description, price, quantity, created_at
         FROM products
        WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: 'Not Found',
        message: `Product with id ${id} does not exist.`,
      });
      return;
    }

    const p = result.rows[0];

    res.status(200).json({
      data: {
        ...p,
        _links: buildLinks([
          link('self',      'GET', req, `/api/products/${p.id}`),
          link('warehouse', 'GET', req, `/api/warehouses/${p.warehouse_id}`),
          link('inventory', 'GET', req, `/api/inventory?warehouseId=${p.warehouse_id}`),
        ]),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/products
 * Registers a product for a warehouse with initial stock.
 *
 * Body: { name, sku, description?, price, quantity, warehouseId }
 * Returns 201 + Location header on success.
 * Returns 400 on validation errors, 404 if warehouse doesn't exist, 409 on duplicate sku.
 */
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const body = req.body as Partial<CreateProductDto>;
  const errors: string[] = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '')
    errors.push('name is required and must be a non-empty string.');

  if (!body.sku || typeof body.sku !== 'string' || body.sku.trim() === '')
    errors.push('sku is required and must be a non-empty string.');

  if (body.price === undefined || body.price === null)
    errors.push('price is required.');
  else if (typeof body.price !== 'number' || isNaN(body.price) || body.price < 0)
    errors.push('price must be a non-negative number.');

  if (body.quantity === undefined || body.quantity === null)
    errors.push('quantity is required.');
  else if (!Number.isInteger(body.quantity) || body.quantity < 0)
    errors.push('quantity must be a non-negative integer.');

  if (body.warehouseId === undefined || body.warehouseId === null)
    errors.push('warehouseId is required.');
  else if (!Number.isInteger(body.warehouseId) || body.warehouseId <= 0)
    errors.push('warehouseId must be a positive integer.');

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Request body validation failed.',
      errors,
    });
    return;
  }

  const { name, sku, description, price, quantity, warehouseId } = body as CreateProductDto;

  try {
    // Verify warehouse exists before insert to return a clean 404
    const warehouseCheck = await pool.query<Warehouse>(
      'SELECT id FROM warehouses WHERE id = $1',
      [warehouseId]
    );

    if (warehouseCheck.rows.length === 0) {
      res.status(404).json({
        error: 'Not Found',
        message: `Warehouse with id ${warehouseId} does not exist.`,
      });
      return;
    }

    const result = await pool.query<Product>(
      `INSERT INTO products (warehouse_id, name, sku, description, price, quantity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, warehouse_id, name, sku, description, price, quantity, created_at`,
      [warehouseId, name.trim(), sku.trim(), description?.trim() ?? null, price, quantity]
    );

    const p = result.rows[0];

    res
      .status(201)
      .setHeader('Location', `${req.protocol}://${req.get('host')}/api/products/${p.id}`)
      .json({
        data: {
          ...p,
          _links: buildLinks([
            link('self',      'GET', req, `/api/products/${p.id}`),
            link('warehouse', 'GET', req, `/api/warehouses/${p.warehouse_id}`),
            link('inventory', 'GET', req, `/api/inventory?warehouseId=${p.warehouse_id}`),
          ]),
        },
      });
  } catch (err) {
    next(err);
  }
}
