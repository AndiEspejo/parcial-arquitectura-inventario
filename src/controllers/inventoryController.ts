import type { Request, Response, NextFunction } from 'express';
import pool from '../db';
import { link, buildLinks } from '../hateoas';
import type { Warehouse, InventoryItem } from '../types';

/**
 * GET /api/inventory?warehouseId={id}
 *
 * Returns the product inventory for a given warehouse.
 *
 * Status codes:
 *   200 — success with product list (may be empty)
 *   400 — warehouseId query param is missing or not a positive integer
 *   404 — warehouse does not exist
 */
export async function getInventory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { warehouseId } = req.query;

  // 400: missing or invalid param
  if (!warehouseId || typeof warehouseId !== 'string') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'warehouseId query parameter is required.',
      example: '/api/inventory?warehouseId=1',
    });
    return;
  }

  if (!/^\d+$/.test(warehouseId) || parseInt(warehouseId, 10) <= 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'warehouseId must be a positive integer.',
    });
    return;
  }

  const id = parseInt(warehouseId, 10);

  try {
    // 404: warehouse must exist
    const warehouseResult = await pool.query<Warehouse>(
      'SELECT id, name, city, address, created_at FROM warehouses WHERE id = $1',
      [id]
    );

    if (warehouseResult.rows.length === 0) {
      res.status(404).json({
        error: 'Not Found',
        message: `Warehouse with id ${id} does not exist.`,
      });
      return;
    }

    const warehouse = warehouseResult.rows[0];

    // Fetch products for this warehouse
    const productsResult = await pool.query<InventoryItem>(
      `SELECT id, name, sku, description, price, quantity, created_at
         FROM products
        WHERE warehouse_id = $1
        ORDER BY id`,
      [id]
    );

    const products = productsResult.rows.map((p) => ({
      ...p,
      _links: buildLinks([
        link('self',      'GET', req, `/api/products/${p.id}`),
        link('warehouse', 'GET', req, `/api/warehouses/${id}`),
      ]),
    }));

    res.status(200).json({
      data: {
        warehouse: {
          ...warehouse,
          _links: buildLinks([
            link('self',      'GET', req, `/api/warehouses/${id}`),
            link('inventory', 'GET', req, `/api/inventory?warehouseId=${id}`),
          ]),
        },
        products,
        totalProducts: products.length,
      },
      _links: buildLinks([
        link('self',       'GET', req, `/api/inventory?warehouseId=${id}`),
        link('warehouse',  'GET', req, `/api/warehouses/${id}`),
        link('warehouses', 'GET', req, '/api/warehouses'),
      ]),
    });
  } catch (err) {
    next(err);
  }
}
