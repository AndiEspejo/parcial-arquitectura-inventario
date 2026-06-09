/**
 * Typed API client for the Warehouse Inventory API.
 *
 * Key decisions:
 * - Always sends `X-API-Version: 1` header (required by the backend middleware).
 * - Uses a relative base path `/api` so nginx (Docker) and Vite proxy (dev mode)
 *   both work without any environment configuration.
 * - `followLink(links, rel)` extracts the path portion from a HAL `_links` href,
 *   allowing the SPA to navigate using the server-provided links (HATEOAS) rather
 *   than hardcoding URLs. This is the key HATEOAS consumption point.
 */

import type {
  HalLinks,
  ListWarehousesResponse,
  InventoryResponse,
  ProductResponse,
  CreateProductDto,
  ValidationErrorResponse,
} from './types';

const BASE = '/api';

// ---------------------------------------------------------------------------
// HATEOAS helper
// ---------------------------------------------------------------------------

/**
 * Extracts the path (+ query string) from a HAL link href so the SPA can
 * call `followLink(links, 'inventory')` and get `/api/inventory?warehouseId=1`
 * regardless of the host/port the server advertised.
 *
 * Example:
 *   href = "http://localhost:3001/api/inventory?warehouseId=1"
 *   → "/api/inventory?warehouseId=1"
 */
export function followLink(links: HalLinks, rel: string): string | null {
  const link = links[rel];
  if (!link) return null;
  try {
    const url = new URL(link.href);
    return url.pathname + url.search;
  } catch {
    // href was already a relative path
    return link.href;
  }
}

// ---------------------------------------------------------------------------
// Internal fetch wrapper
// ---------------------------------------------------------------------------

interface FetchOptions {
  method?: string;
  body?: unknown;
}

/**
 * Thin fetch wrapper. Attaches the required version header and Content-Type,
 * parses JSON, and throws a typed error object on non-2xx responses.
 */
async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;

  const headers: Record<string, string> = {
    'X-API-Version': '1',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // The error body may not be JSON (e.g. an nginx 502 HTML page), so the
    // status code must be preserved even when parsing fails
    const payload = await response.json().catch(() => ({
      error: 'Unexpected Error',
      message: `Request failed with status ${response.status}`,
    }));
    throw new ApiError(response.status, payload);
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Typed error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  payload: ValidationErrorResponse;

  constructor(status: number, payload: ValidationErrorResponse) {
    super(payload.message ?? 'API error');
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/** GET /api/warehouses — returns all warehouses with HAL links */
export async function fetchWarehouses(): Promise<ListWarehousesResponse> {
  return apiFetch<ListWarehousesResponse>(`${BASE}/warehouses`);
}

/**
 * GET /api/inventory?warehouseId={id}
 *
 * Prefers to navigate using the HAL `inventory` link from a warehouse response
 * when available (HATEOAS), falling back to the hardcoded path.
 */
export async function fetchInventory(
  warehouseId: number,
  inventoryHref?: string | null,
): Promise<InventoryResponse> {
  const path = inventoryHref ?? `${BASE}/inventory?warehouseId=${warehouseId}`;
  return apiFetch<InventoryResponse>(path);
}

/** POST /api/products — creates a new product, returns 201 + product data */
export async function createProduct(dto: CreateProductDto): Promise<ProductResponse> {
  return apiFetch<ProductResponse>(`${BASE}/products`, {
    method: 'POST',
    body: dto,
  });
}
