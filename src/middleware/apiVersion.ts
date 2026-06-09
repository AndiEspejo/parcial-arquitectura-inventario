import type { Request, Response, NextFunction } from 'express';

/**
 * API versioning middleware (Custom Request Header strategy).
 *
 * Rules:
 *  - Required header: X-API-Version
 *  - Supported values: '1'
 *  - Missing header      → 400 Bad Request
 *  - Unsupported version → 406 Not Acceptable
 *  - Success             → echo X-API-Version in response header
 */

const SUPPORTED_VERSIONS: string[] = ['1'];

export function apiVersion(req: Request, res: Response, next: NextFunction): void {
  const version = req.headers['x-api-version'];

  if (!version) {
    res.status(400).json({
      error: 'Missing Required Header',
      message: 'X-API-Version header is required for all /api routes.',
      requiredHeader: 'X-API-Version',
      supportedVersions: SUPPORTED_VERSIONS,
    });
    return;
  }

  const versionStr = Array.isArray(version) ? version[0] : version;

  if (!SUPPORTED_VERSIONS.includes(versionStr)) {
    res.status(406).json({
      error: 'API Version Not Acceptable',
      message: `Version "${versionStr}" is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      receivedVersion: versionStr,
      supportedVersions: SUPPORTED_VERSIONS,
    });
    return;
  }

  // Echo negotiated version back to client
  res.setHeader('X-API-Version', versionStr);
  next();
}
