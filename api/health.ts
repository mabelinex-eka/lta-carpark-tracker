import type { Request, Response } from 'express';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  service: string;
  endpoints: {
    carparkAvailability: string;
  };
  config: {
    hasAccountKeyConfigured: boolean;
    environment: string;
  };
}

/**
 * Serverless / Express health check endpoint
 * Route: /api/health
 */
export default async function handler(req: Request, res: Response) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const accountKey =
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    (req.headers['account-key'] as string);

  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'lta-carpark-tracker-api',
    endpoints: {
      carparkAvailability: '/api/carparkavailability',
    },
    config: {
      hasAccountKeyConfigured: Boolean(accountKey && accountKey.trim().length > 0),
      environment: process.env.NODE_ENV || 'development',
    },
  };

  return res.status(200).json(payload);
}
