import type { Request, Response, NextFunction } from 'express';
import pool from '../db';
import { link, buildLinks } from '../hateoas';
import type { Warehouse, CreateWarehouseDto } from '../types';

/**
 * GET /api/warehouses
 * Returns all warehouses with HATEOAS links.
 */
export async function listWarehouses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await pool.query<Warehouse>(
      'SELECT id, name, city, address, created_at FROM warehouses ORDER BY id'
    );

    const warehouses = result.rows.map((w) => ({
      ...w,
      _links: buildLinks([
        link('self',      'GET', req, `/api/warehouses/${w.id}`),
        link('inventory', 'GET', req, `/api/inventory?warehouseId=${w.id}`),
      ]),
    }));

    res.status(200).json({
      data: warehouses,
      _links: buildLinks([
        link('self', 'GET', req, '/api/warehouses'),
      ]),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/warehouses/:id
 * Returns a single warehouse by primary key. 404 if not found.
 */
export async function getWarehouse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Warehouse id must be a positive integer.',
    });
    return;
  }

  try {
    const result = await pool.query<Warehouse>(
      'SELECT id, name, city, address, created_at FROM warehouses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: 'Not Found',
        message: `Warehouse with id ${id} does not exist.`,
      });
      return;
    }

    const w = result.rows[0];

    res.status(200).json({
      data: {
        ...w,
        _links: buildLinks([
          link('self',       'GET', req, `/api/warehouses/${w.id}`),
          link('inventory',  'GET', req, `/api/inventory?warehouseId=${w.id}`),
          link('warehouses', 'GET', req, '/api/warehouses'),
        ]),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/warehouses
 * Creates a new warehouse. Returns 201 + Location header.
 *
 * Body: { name: string, city: string, address: string }
 */
export async function createWarehouse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const body = req.body as Partial<CreateWarehouseDto>;
  const errors: string[] = [];

  if (!body.name    || typeof body.name    !== 'string' || body.name.trim() === '')
    errors.push('name is required and must be a non-empty string.');
  if (!body.city    || typeof body.city    !== 'string' || body.city.trim() === '')
    errors.push('city is required and must be a non-empty string.');
  if (!body.address || typeof body.address !== 'string' || body.address.trim() === '')
    errors.push('address is required and must be a non-empty string.');

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Request body validation failed.',
      errors,
    });
    return;
  }

  const { name, city, address } = body as CreateWarehouseDto;

  try {
    const result = await pool.query<Warehouse>(
      `INSERT INTO warehouses (name, city, address)
       VALUES ($1, $2, $3)
       RETURNING id, name, city, address, created_at`,
      [name.trim(), city.trim(), address.trim()]
    );

    const w = result.rows[0];

    res
      .status(201)
      .setHeader('Location', `${req.protocol}://${req.get('host')}/api/warehouses/${w.id}`)
      .json({
        data: {
          ...w,
          _links: buildLinks([
            link('self',       'GET', req, `/api/warehouses/${w.id}`),
            link('inventory',  'GET', req, `/api/inventory?warehouseId=${w.id}`),
            link('warehouses', 'GET', req, '/api/warehouses'),
          ]),
        },
      });
  } catch (err) {
    next(err);
  }
}
