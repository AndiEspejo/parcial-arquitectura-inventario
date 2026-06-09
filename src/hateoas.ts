import type { Request } from 'express';
import type { HalLink, HalLinks } from './types';

/**
 * Derives the base URL (scheme + host) from an incoming Express request.
 * Uses the X-Forwarded-Proto header when behind a reverse proxy.
 * Falls back gracefully in test environments.
 */
export function baseUrl(req: Request): string {
  try {
    const proto = req.get('x-forwarded-proto') ?? req.protocol ?? 'http';
    const host  = req.get('host') ?? 'localhost:3000';
    return `${proto}://${host}`;
  } catch {
    return '';
  }
}

/**
 * Builds a single HAL link descriptor.
 *
 * @param rel    - Relationship name, e.g. 'self', 'warehouse', 'products'
 * @param method - HTTP method in uppercase, e.g. 'GET', 'POST'
 * @param req    - Incoming request — used to derive the absolute base URL
 * @param path   - API path starting with '/', e.g. '/api/products/5'
 */
export function link(rel: string, method: string, req: Request, path: string): HalLink & { rel: string } {
  return { rel, href: `${baseUrl(req)}${path}`, method };
}

/**
 * Converts an array of link descriptors into a _links map keyed by `rel`.
 *
 * @example
 * buildLinks([
 *   link('self',      'GET', req, '/api/products/5'),
 *   link('warehouse', 'GET', req, '/api/warehouses/2'),
 * ])
 * // → { self: { href: '...', method: 'GET' }, warehouse: { href: '...', method: 'GET' } }
 */
export function buildLinks(
  linksArray: Array<{ rel: string; href: string; method: string }>
): HalLinks {
  return linksArray.reduce<HalLinks>((acc, { rel, href, method }) => {
    acc[rel] = { href, method };
    return acc;
  }, {});
}
