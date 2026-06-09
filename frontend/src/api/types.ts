/**
 * Frontend mirror of the backend domain types (src/types.ts).
 * Kept in sync with the OpenAPI spec in docs/openapi.yaml.
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
// Entity types
// ---------------------------------------------------------------------------

export interface Warehouse {
  id: number;
  name: string;
  city: string;
  address: string;
  created_at: string; // ISO 8601 string from JSON
}

export interface WarehouseWithLinks extends Warehouse {
  _links: HalLinks;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: string; // NUMERIC comes back as string from pg
  quantity: number;
  created_at: string;
  _links: HalLinks;
}

export interface Product {
  id: number;
  warehouse_id: number;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  quantity: number;
  created_at: string;
  _links: HalLinks;
}

// ---------------------------------------------------------------------------
// DTO types (request bodies) — mirrored from CreateProductDto
// ---------------------------------------------------------------------------

export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  price: number;
  quantity: number;
  warehouseId: number;
}

// ---------------------------------------------------------------------------
// API response envelopes
// ---------------------------------------------------------------------------

export interface ListWarehousesResponse {
  data: WarehouseWithLinks[];
  _links: HalLinks;
}

export interface InventoryData {
  warehouse: WarehouseWithLinks;
  products: InventoryItem[];
  totalProducts: number;
}

export interface InventoryResponse {
  data: InventoryData;
  _links: HalLinks;
}

export interface ProductResponse {
  data: Product;
}

// ---------------------------------------------------------------------------
// API error response shapes (from OpenAPI spec)
// ---------------------------------------------------------------------------

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  errors: string[];
}

export interface VersionErrorResponse extends ErrorResponse {
  requiredHeader?: string;
  supportedVersions?: string[];
}
