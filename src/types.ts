/**
 * Domain types, DTOs, and HAL link types for the Warehouse Inventory API.
 */

// ---------------------------------------------------------------------------
// HAL / HATEOAS types
// ---------------------------------------------------------------------------

export interface HalLink {
  href: string;
  method: string;
}

export interface HalLinks {
  [rel: string]: HalLink;
}

// ---------------------------------------------------------------------------
// Entity types (mirror database schema)
// ---------------------------------------------------------------------------

export interface Warehouse {
  id: number;
  name: string;
  city: string;
  address: string;
  created_at: Date;
}

export interface Product {
  id: number;
  warehouse_id: number;
  name: string;
  sku: string;
  description: string | null;
  price: string; // pg returns NUMERIC as string
  quantity: number;
  created_at: Date;
}

// ---------------------------------------------------------------------------
// DTO types (request bodies)
// ---------------------------------------------------------------------------

export interface CreateWarehouseDto {
  name: string;
  city: string;
  address: string;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  price: number;
  quantity: number;
  warehouseId: number;
}

// ---------------------------------------------------------------------------
// Response types (entity + _links)
// ---------------------------------------------------------------------------

export interface WarehouseResponse extends Warehouse {
  _links: HalLinks;
}

export interface ProductResponse extends Product {
  _links: HalLinks;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  quantity: number;
  created_at: Date;
  _links: HalLinks;
}

export interface InventoryResponse {
  warehouse: Warehouse;
  products: InventoryItem[];
  _links: HalLinks;
}

// ---------------------------------------------------------------------------
// HTTP error helper type
// ---------------------------------------------------------------------------

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    // Maintains proper prototype chain in ES5 compiled output
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}
